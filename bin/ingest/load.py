import json
from datetime import datetime

import pandas as pd
import requests
import time
import os
import sys
from dotenv import load_dotenv

metadata = None
school_udise_id_map = {}


def load_metadata():
    global metadata, school_udise_id_map
    query = """
        query GetMetadata {
          actors {
            id
            name
          }
          blocks {
            id
            district_id
            name
          }
          designations {
            id
            name
          }
          districts {
            id
            name
          }
          school_list {
            id
            udise
            district_id
            block_id
          }
        }
    """
    headers = {
        'x-hasura-admin-secret': f'{os.getenv("HASURA_SECRET")}',
        'Content-Type': 'application/json'
    }
    response = requests.request("POST", f"{os.getenv('HASURA_URL')}", headers=headers, json={"query": query})
    if response.status_code == 200:
        metadata = json.loads(response.text)

        # populate the school udise id map
        for school in metadata['data']['school_list']:
            school_udise_id_map[school['udise']] = school
        return metadata
    else:
        print(response.status_code, response.text)
        return None


def get_district_id(district_name):
    for district in metadata['data']['districts']:
        if district['name'] == district_name:
            return district['id']
    return None


def get_block_id(district_id, block_name):
    for block in metadata['data']['blocks']:
        if block['name'].lower() == block_name.lower() and block['district_id'] == district_id:
            return block['id']
    return None


def get_designation_id(designation_name):
    for designation in metadata['data']['designations']:
        if designation['name'] == designation_name:
            return designation['id']
    return None


def get_actor_id(designation_id):
    if designation_id == 1:
        return 2
    if designation_id == 5:
        return 4
    if designation_id == 6:
        return 3
    return 1


def get_school_id_from_udise(udise):
    global school_udise_id_map
    return school_udise_id_map.get(udise, None)


def create_request(username):
    data = {
        "registration": {
            "applicationId": f"{os.getenv('APPLICATION_ID')}",
            "preferredLanguages": ["en"],
            "roles": [],
            "timezone": "Asia/Kolkata",
            "username": username,
            "usernameStatus": "ACTIVE",
        },
        "user": {
            "preferredLanguages": ["en"],
            "timezone": "Asia/Kolkata",
            "usernameStatus": "ACTIVE",
            "username": username,
            "password": f"{os.getenv('PASSWORD_VARIABLE')}"
        },
    }

    payload = json.dumps(data)
    headers = {
        'Authorization': f'{os.getenv("CREATE_USER_AUTHORIZATION")}',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", f"{os.getenv('CREATE_USER_URL')}", headers=headers, data=payload)
    if response.status_code == 200:
        data = json.loads(response.text)
        return data
    else:
        print(response.status_code, response.text)
        return None


def insert_to_table(phone_no, district_id, designation_id, actor_id, officer_name, area_type, block_id, subject,
                    school_list_id):
    payload = """mutation insert_mentor_one {
        insert_mentor_one(object: {area_type: "%area_type", block_id: %block_id, designation_id: %designation_id, district_id: %district_id, actor_id: %actor_id, officer_name: "%officer_name", phone_no: "%phone_no", subject_of_matter: "%subject_of_matter"}, on_conflict: {constraint: mentor_phone_no_key, update_columns: [area_type, block_id, designation_id, district_id, officer_name, subject_of_matter, actor_id]}) {
            id
        }
    }
    """

    teacher_mapping_mutation = """mutation CreateTeacherSchoolListMapping {
        insert_teacher_school_list_mapping_one(object: {mentor_id: "%mentor_id", school_list_id: %school_list_id}, on_conflict: {constraint: teacher_school_list_mapping_mentor_id_school_list_id_key, update_columns: mentor_id}) {
            id
            mentor_id
            school_list_id
        }
    }
    """
    headers = {
        'x-hasura-admin-secret': f'{os.getenv("HASURA_SECRET")}',
        'Content-Type': 'application/json'
    }
    body = payload.replace("%area_type", str(area_type)).replace("%block_id", str(block_id)).replace(
        "%designation_id", str(designation_id)).replace("%district_id", str(district_id))\
        .replace("%officer_name", str(officer_name)).replace("%phone_no", str(phone_no))\
        .replace("%subject_of_matter", str(subject)).replace("%actor_id", str(actor_id))
    response = requests.request("POST", f"{os.getenv('HASURA_URL')}", headers=headers, json={"query": body})
    if response.status_code == 200:
        data = json.loads(response.text)
        print("Data: ", data)
        if designation_id == 6 and school_list_id:
            teacher_body = teacher_mapping_mutation.replace("%mentor_id",
                                                            str(data['data']['insert_mentor_one']['id'])).replace(
                "%school_list_id", str(school_list_id))
            teacher_response = requests.request("POST", f"{os.getenv('HASURA_URL')}", headers=headers,
                                                json={"query": teacher_body})
            if teacher_response.status_code == 200:
                return data
            else:
                print(teacher_response.status_code, teacher_response.text)
                return None
        return data
    else:
        print(response.status_code, response.text)
        return None


def main():
    load_dotenv()
    if load_metadata() is None:
        print('Failed loading metadata..Exiting..')
        exit(1)
    # print(metadata)
    fa_failed = []
    table_failed = []
    validation_failed = []
    df = pd.read_csv("mentors.csv", encoding='utf-8', skiprows=1, header=None)
    df = df.values.tolist()
    cnt = 0
    for d in df:
        cnt = cnt + 1
        print(cnt)
        if str(d[2]) == 'nan':
            print("Error: District cannot be empty")
            table_failed.append(d[1])
            continue
        if str(d[6]) == 'nan':
            print("Error: Designation cannot be empty")
            table_failed.append(d[1])
            continue
        d[3] = '' if str(d[3]) == 'nan' else d[3]  # setting block_town_name as empty string if passed empty
        d[4] = '' if str(d[4]) == 'nan' else d[4]  # setting area_type as empty string if passed empty
        d[7] = '' if str(d[7]) == 'nan' else d[7]  # setting subject_of_matter as empty string if passed empty
        phone_no = d[1]
        district_name = d[2]
        block_name = d[3]
        area_type = d[4]
        officer_name = d[5]
        designation_name = d[6]
        subject = d[7]
        school_udise = d[8]

        area_type = '' if area_type in ['nan', 'None', 'none', '-'] else area_type
        block_name = '' if block_name in ['nan', 'None', 'none', '-'] else block_name
        designation_name = '' if designation_name in ['nan', 'None', 'none', '-'] else designation_name
        district_name = '' if district_name in ['nan', 'None', 'none', '-'] else district_name
        officer_name = '' if officer_name in ['nan', 'None', 'none', '-'] else officer_name
        subject = '' if subject in ['nan', 'None', 'none', '-'] else subject
        school_udise = '' if school_udise in ['nan', 'None', 'none', '-'] else school_udise

        district_id = get_district_id(district_name)
        if school_udise == '' and district_id is None:
            print("Error: Failed to find district id mapping for phone: ", d[1])
            validation_failed.append(d)
            continue

        block_id = get_block_id(district_id, block_name)
        if school_udise == '' and block_id is None and block_name != '':
            print("Error: Failed to find block id mapping for phone: ", d[1])
            validation_failed.append(d)
            continue

        if block_id is None:
            block_id = 'null'

        designation_id = get_designation_id(designation_name)
        if designation_id is None:
            print("Error: Failed to find designation id mapping for phone: ", d[1])
            validation_failed.append(d)
            continue
        actor_id = get_actor_id(designation_id)

        # check if udise is valid from our global map
        school = get_school_id_from_udise(school_udise)
        if school_udise != '' and school is None:
            print("Error: Failed to find School id mapping against Udise for phone: ", d[1])
            validation_failed.append(d)
            continue

        if school is not None:
            # since we have school info, we'll fetch the district school object
            district_id = school.get('district_id')
            block_id = school.get('block_id')

        data = create_request(d[1])     # insert in fusion auth
        if data is not None:
            print("For", d[1], "FaId: ", data['user']['id'])
        else:
            fa_failed.append(d)
            print("Error: Failed to create fusion auth id for phone: ", d[1])

        table_data = insert_to_table(phone_no, district_id, designation_id, actor_id, officer_name, area_type,
                                     block_id,
                                     subject, school_id)  # insert in table
        if table_data is not None:
            print("For", d[1], "TableId: ", table_data['data']['insert_mentor_one']['id'])
        else:
            table_failed.append(d)
            print("Error: Failed to insert into table for phone: ", d[1])
        print("######################################################################")
        time.sleep(0.3)
    print("Failed FA entries", fa_failed)
    print("######################################################################")
    print("Failed Table entries", table_failed)
    print("######################################################################")
    print("Failed validation entries", table_failed)

    if len(fa_failed):
        df = pd.DataFrame(fa_failed)
        error_filepath = 'logs/' + datetime.today().strftime('%Y-%m-%d_%H_%M_%S') + '-fa_failed.csv'
        with open(error_filepath, "w") as my_file:
            df.to_csv(my_file, index=False)
            pass  # or write something to it already
    if len(table_failed):
        df = pd.DataFrame(table_failed)
        error_filepath = 'logs/' + datetime.today().strftime('%Y-%m-%d_%H_%M_%S') + '-table_failed.csv'
        with open(error_filepath, "w") as my_file:
            df.to_csv(my_file, index=False)
            pass  # or write something to it already
    if len(validation_failed):
        df = pd.DataFrame(validation_failed)
        error_filepath = 'logs/' + datetime.today().strftime('%Y-%m-%d_%H_%M_%S') + '-validation_failed.csv'
        with open(error_filepath, "w") as my_file:
            df.to_csv(my_file, index=False)
            pass  # or write something to it already


if __name__ == "__main__":
    main()
