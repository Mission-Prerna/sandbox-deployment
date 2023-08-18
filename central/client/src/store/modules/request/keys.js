/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Option from '../../../util/option';

// Each type of response data that the `request` module manages is associated
// with a key. Each key tends to correspond to a single Backend endpoint.
export const keys = [
  'centralVersion',

  'session',
  'currentUser',

  'users',
  'user',

  'roles',
  // Actors associated with sitewide assignments
  'actors',

  'projects',
  'project',
  'projectAssignments',
  'forms',
  'deletedForms',
  'formSummaryAssignments',
  'form',
  // The fields for a particular form version, whether the primary version or
  // otherwise
  'fields',
  'formVersions',
  'formVersionXml',
  'formDraft',
  // Form draft attachments
  'attachments',
  // A single chunk of submissions OData for a particular form version
  'odataChunk',
  // Encryption keys for a particular form version
  'keys',
  'submitters',
  'submission',
  'audits',
  'comments',
  'diffs',
  'submissionVersion',
  'publicLinks',
  'fieldKeys',

  'backupsConfig',
  'analyticsConfig',
  'analyticsPreview'
];



////////////////////////////////////////////////////////////////////////////////
// TRANSFORM RESPONSES

// Define functions to transform responses.

const option = (transform = undefined) => (response, container) => (response.status === 200
  ? Option.of(transform != null ? transform(response, container) : response.data)
  : Option.none());

const userPresenter = ({ data }, { User }) => User.from(data);
const formPresenters = ({ data }, { Form }) => data.map(Form.from);
const formPresenter = ({ data }, { Form }) => Form.from(data);

export const transforms = {
  currentUser: userPresenter,

  users: ({ data }, { User }) => data.map(User.from),
  user: userPresenter,

  projects: ({ data }, { Project, Form }) => data.map(project => Project.from({
    ...project,
    formList: project.formList.map(Form.from)
  })),
  project: ({ data }, { Project }) => Project.from(data),
  forms: formPresenters,
  deletedForms: formPresenters,
  form: formPresenter,
  fields: ({ data }, { Field }) => data.map(Field.from),
  formVersions: formPresenters,
  formDraft: option(formPresenter),
  attachments: option(),
  odataChunk: ({ data, config }) => ({
    ...data,
    filtered: config.url.includes('%24filter=')
  }),
  submission: ({ data }) => data.value[0],

  backupsConfig: option(),
  analyticsConfig: option()
};



////////////////////////////////////////////////////////////////////////////////
// GETTERS

const dataGetters = {
  rolesBySystem: ({ data: { roles } }) => {
    if (roles == null) return null;
    // Using Object.create(null) in case there is a role whose `system` property
    // is '__proto__'.
    const bySystem = Object.create(null);
    for (const role of roles)
      bySystem[role.system] = role;
    return bySystem;
  },
  projectRoles: (_, { rolesBySystem }) => {
    if (rolesBySystem == null) return null;
    // If you add a new role, make sure to also add a new i18n message.
    return [
      rolesBySystem.manager,
      rolesBySystem.viewer,
      rolesBySystem.formfill
    ];
  },

  selectableFields: ({ data: { fields } }) => {
    if (fields == null) return null;
    const selectable = [];
    // The path of the top-level repeat group currently being traversed
    let repeat = null;
    for (const field of fields) {
      const { path } = field;
      if (repeat == null || !path.startsWith(repeat)) {
        repeat = null;
        // Note that `type` may be `undefined`, though I have seen this only in
        // the Widgets sample form (<branch>):
        // https://github.com/getodk/sample-forms/blob/e9fe5838e106b04bf69f43a8a791327093571443/Widgets.xml
        const { type } = field;
        if (type === 'repeat') {
          repeat = `${path}/`;
        } else if (type !== 'structure' && path !== '/meta/instanceID' &&
          path !== '/instanceID') {
          selectable.push(field);
        }
      }
    }
    return selectable;
  },
  binaryFieldPaths: ({ data: { fields } }) => {
    if (fields == null) return null;
    return fields.reduce(
      (acc, cur) => (cur.binary ? acc.add(cur.path) : acc),
      new Set()
    );
  },
  missingAttachmentCount: ({ data: { attachments } }) => {
    if (attachments == null) return null;
    if (attachments.isEmpty()) return 0;
    return attachments.get().reduce(
      (count, attachment) => (attachment.exists ? count : count + 1),
      0
    );
  },
  fieldKeysWithToken: ({ data: { fieldKeys } }) => (fieldKeys != null
    ? fieldKeys.filter(fieldKey => fieldKey.token != null)
    : null),

  // Returns the backup attempts for the current backups config.
  auditsForBackupsConfig: ({ data: { audits, backupsConfig } }) => {
    if (audits == null || backupsConfig == null) return null;
    if (backupsConfig.isEmpty()) return [];

    const result = [];
    for (const audit of audits) {
      if (audit.loggedAt < backupsConfig.get().setAt) {
        // Any backup attempts that follow are for a previous config: `audits`
        // is sorted descending by loggedAt.
        break;
      }
      // eslint-disable-next-line no-continue
      if (audit.action !== 'backup') continue;

      const { details } = audit;
      /* This will evaluate to `false` only if an attempt for a previous config
      was logged after the current config was created, which seems unlikely. A
      failed attempt might not have a configSetAt property, which means that if
      a failed attempt was logged after the current config was created, we might
      not be able to determine whether the attempt corresponds to the current
      config or (again unlikely) to a previous one. We assume that an attempt
      without a configSetAt property corresponds to the current config. */
      if (details.configSetAt === backupsConfig.get().setAt ||
        details.configSetAt == null)
        result.push(audit);
    }
    return result;
  }
};
export const getters = dataGetters;
