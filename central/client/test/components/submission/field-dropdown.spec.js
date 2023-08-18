import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionFieldDropdown from '../../../src/components/submission/field-dropdown.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mount } from '../../util/lifecycle';

const { repeat, group, string } = testData.fields;
const strings = (min, max) => {
  const result = new Array(max - min + 1);
  for (let i = 0; i < result.length; i += 1)
    result[i] = string(`/s${min + i}`);
  return result;
};

describe('SubmissionFieldDropdown', () => {
  it('renders a checkbox for each selectable field', () => {
    const dropdown = mount(SubmissionFieldDropdown, {
      props: { modelValue: [] },
      container: {
        requestData: {
          fields: [repeat('/r'), string('/r/s1'), string('/s2'), string('/s3')]
        }
      }
    });
    const text = dropdown.findAll('.checkbox span').map(label => label.text());
    text.should.eql(['s2', 's3']);
  });

  it('adds a title attribute for checkbox that includes group name', () => {
    const dropdown = mount(SubmissionFieldDropdown, {
      props: { modelValue: [] },
      container: {
        requestData: { fields: [group('/g'), string('/g/s1')] }
      }
    });
    const span = dropdown.get('.checkbox span');
    span.text().should.equal('s1');
    span.attributes().title.should.equal('g-s1');
  });

  describe('checked boxes', () => {
    it('checks boxes based on the modelValue prop', () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 2) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [fields[0]] },
        container
      });
      const checkboxes = dropdown.findAll('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.true();
      checkboxes[1].element.checked.should.be.false();
    });

    it('updates the checkboxes after the modelValue prop changes', async () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 2) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [fields[0]] },
        container
      });
      const checkboxes = dropdown.findAll('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.true();
      checkboxes[1].element.checked.should.be.false();
      await dropdown.setProps({ modelValue: [fields[1]] });
      checkboxes[0].element.checked.should.be.false();
      checkboxes[1].element.checked.should.be.true();
    });
  });

  describe('after the dropdown is hidden', () => {
    it('emits an update:modelValue event if selection has changed', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s1')] }
        },
        attachTo: document.body
      });
      await dropdown.get('select').trigger('click');
      await dropdown.get('input[type="checkbox"]').setChecked();
      await dropdown.get('select').trigger('click');
      const value = dropdown.emitted('update:modelValue')[0][0];
      value.length.should.equal(1);
      value[0].path.should.equal('/s1');
    });

    it('does not emit an update:modelValue event if selection has not changed', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s1')] }
        },
        attachTo: document.body
      });
      await dropdown.get('select').trigger('click');
      await dropdown.get('input[type="checkbox"]').setChecked();
      await dropdown.get('input[type="checkbox"]').setChecked(false);
      await dropdown.get('select').trigger('click');
      should.not.exist(dropdown.emitted('update:modelValue'));
    });
  });

  it('disables an unchecked box after 100 fields have been selected', () => {
    const container = createTestContainer({
      requestData: { fields: strings(1, 101) }
    });
    const { fields } = container.store.state.request.data;
    const dropdown = mount(SubmissionFieldDropdown, {
      props: { modelValue: fields.slice(0, 100) },
      container
    });
    const disabled = dropdown.findAll('.checkbox.disabled');
    disabled.length.should.equal(1);
    const span = disabled[0].get('span');
    span.text().should.equal('s101');
    disabled[0].get('input').element.disabled.should.be.true();
    const label = disabled[0].get('label');
    label.attributes().title.should.equal('Cannot select more than 100 columns.');
    should.not.exist(span.attributes().title);
  });

  describe('placeholder', () => {
    it('shows the number of selectable fields', () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [repeat('/r'), string('/r/s1'), string('/s2')] }
        }
      });
      dropdown.get('option').text().should.endWith(' of 1');
    });

    it('shows the number of selected fields', () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 2) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [fields[0]] },
        container
      });
      dropdown.get('option').text().should.equal('1 of 2');
    });

    it('does not update after a checkbox is checked', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s1')] }
        }
      });
      await dropdown.get('input[type="checkbox"]').setChecked();
      dropdown.get('option').text().should.equal('0 of 1');
    });

    it('updates after the modelValue prop changes', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s1')] }
        }
      });
      const { fields } = dropdown.vm.$store.state.request.data;
      await dropdown.setProps({ modelValue: fields });
      dropdown.get('option').text().should.equal('1 of 1');
    });
  });

  describe('search', () => {
    it('adds a class for a field the matches the search', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: strings(1, 2) }
        }
      });
      dropdown.findAll('.search-match').length.should.equal(2);
      await dropdown.get('.search input').setValue('1');
      const matches = dropdown.findAll('.search-match');
      matches.length.should.equal(1);
      matches[0].get('span').text().should.equal('s1');
    });

    it('searches the group name', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [group('/g'), string('/g/s1'), string('/s2')] }
        }
      });
      await dropdown.get('.search input').setValue('g');
      const matches = dropdown.findAll('.search-match');
      matches.length.should.equal(1);
      matches[0].get('span').text().should.equal('s1');
    });

    it('completes a case-insensitive search', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s'), string('/S'), string('/x')] }
        }
      });
      await dropdown.get('.search input').setValue('s');
      dropdown.findAll('.search-match').length.should.equal(2);
      await dropdown.get('.search input').setValue('S');
      dropdown.findAll('.search-match').length.should.equal(2);
    });

    it('shows a message if there are no matches', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s1')] }
        },
        attachTo: document.body
      });
      await dropdown.get('select').trigger('click');
      const li = dropdown.findAll('.dropdown-menu ul li');
      li.length.should.equal(2);
      li[0].should.be.visible(true);
      li[1].should.be.hidden(true);
      await dropdown.get('.search input').setValue('foo');
      li[0].should.be.hidden(true);
      li[1].should.be.visible(true);
    });

    it('resets after the dropdown is hidden', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [string('/s1')] }
        },
        attachTo: document.body
      });
      await dropdown.get('select').trigger('click');
      await dropdown.get('.search input').setValue('1');
      await dropdown.get('select').trigger('click');
      dropdown.get('.search input').element.value.should.equal('');
    });

    describe('.close button', async () => {
      it('shows the button after input', async () => {
        const dropdown = mount(SubmissionFieldDropdown, {
          props: { modelValue: [] },
          container: {
            requestData: { fields: [string('/s1')] }
          }
        });
        const button = dropdown.get('.close');
        button.should.be.hidden();
        await dropdown.get('.search input').setValue('1');
        button.should.be.visible();
      });

      describe('after the button is clicked', () => {
        it('resets the search', async () => {
          const dropdown = mount(SubmissionFieldDropdown, {
            props: { modelValue: [] },
            container: {
              requestData: { fields: [string('/s1')] }
            }
          });
          await dropdown.get('.search input').setValue('1');
          await dropdown.get('.close').trigger('click');
          dropdown.get('.search input').element.value.should.equal('');
        });

        it('focuses the input', async () => {
          const dropdown = mount(SubmissionFieldDropdown, {
            props: { modelValue: [] },
            container: {
              requestData: { fields: [string('/s1')] }
            },
            attachTo: document.body
          });
          await dropdown.get('select').trigger('click');
          await dropdown.get('.search input').setValue('1');
          await dropdown.get('.close').trigger('click');
          dropdown.get('.search input').should.be.focused();
        });
      });
    });
  });

  describe('select all', () => {
    it('checks all checkboxes', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: strings(1, 2) }
        }
      });
      await dropdown.get('.toggle-all a').trigger('click');
      for (const checkbox of dropdown.findAll('input[type="checkbox"]'))
        checkbox.element.checked.should.be.true();
    });

    it('only checks search results', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: strings(1, 2) }
        }
      });
      await dropdown.get('.search input').setValue('1');
      await dropdown.get('.toggle-all a').trigger('click');
      const checkboxes = dropdown.findAll('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.true();
      checkboxes[1].element.checked.should.be.false();
    });

    it('disables an unchecked box if 100 checkboxes become checked', async () => {
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: [] },
        container: {
          requestData: { fields: [...strings(1, 100), string('/x')] }
        }
      });
      await dropdown.get('.search input').setValue('s');
      await dropdown.get('.toggle-all a').trigger('click');
      dropdown.findAll('.checkbox')[100].classes('disabled').should.be.true();
    });

    it('is disabled if 100 checkboxes are checked', () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 101) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: fields.slice(0, 100) },
        container
      });
      dropdown.get('.toggle-all a').classes('disabled').should.be.true();
    });

    it('is disabled if selecting all would check more than 100 checkboxes', async () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 101) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: fields.slice(0, 99) },
        container
      });
      const checkboxes = dropdown.findAll('input[type="checkbox"]');
      await checkboxes[9].setChecked(false);
      await checkboxes[100].setChecked();
      await dropdown.get('.search input').setValue('10');
      dropdown.get('.toggle-all a').classes('disabled').should.be.true();
    });
  });

  describe('select none', () => {
    it('unchecks all checkboxes', async () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 2) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: fields },
        container
      });
      await dropdown.findAll('.toggle-all a')[1].trigger('click');
      for (const checkbox of dropdown.findAll('input[type="checkbox"]'))
        checkbox.element.checked.should.be.false();
    });

    it('only unchecks search results', async () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 2) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: fields },
        container
      });
      await dropdown.get('.search input').setValue('1');
      await dropdown.findAll('.toggle-all a')[1].trigger('click');
      const checkboxes = dropdown.findAll('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.false();
      checkboxes[1].element.checked.should.be.true();
    });

    it('re-enables a disabled checkbox', async () => {
      const container = createTestContainer({
        requestData: { fields: strings(1, 101) }
      });
      const { fields } = container.store.state.request.data;
      const dropdown = mount(SubmissionFieldDropdown, {
        props: { modelValue: fields.slice(0, 100) },
        container
      });
      const last = dropdown.findAll('.checkbox')[100];
      last.classes('disabled').should.be.true();
      await dropdown.findAll('.toggle-all a')[1].trigger('click');
      last.classes('disabled').should.be.false();
    });
  });

  it('is not rendered if there are 11 selectable fields', async () => {
    testData.extendedForms.createPast(1, {
      fields: [...strings(1, 11), repeat('/r'), string('/r/s12')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    const component = await loadSubmissionList();
    component.findComponent(SubmissionFieldDropdown).exists().should.be.false();
    component.getComponent(SubmissionTable).props().fields.length.should.equal(11);
  });

  it('initially selects first 10 if there are 12 selectable fields', async () => {
    testData.extendedForms.createPast(1, {
      fields: [repeat('/r'), string('/r/s1'), ...strings(2, 13)],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    const component = await loadSubmissionList();
    const selected = component.getComponent(SubmissionFieldDropdown).props().modelValue;
    selected.map(field => field.path).should.eql([
      '/s2', '/s3', '/s4', '/s5', '/s6',
      '/s7', '/s8', '/s9', '/s10', '/s11'
    ]);
    component.getComponent(SubmissionTable).props().fields.should.equal(selected);
  });

  describe('after the selection changes', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, {
        fields: strings(1, 12),
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1);
    });

    const uncheckFirst = async (component) => {
      const dropdown = component.getComponent(SubmissionFieldDropdown);
      await dropdown.get('select').trigger('click');
      await dropdown.get('input[type="checkbox"]').setChecked(false);
      return dropdown.get('select').trigger('click');
    };

    it('sends a request for submissions', () =>
      loadSubmissionList({ attachTo: document.body })
        .complete()
        .request(uncheckFirst)
        .beforeEachResponse((_, { url }) => {
          url.should.containEql('.svc/Submissions');
        })
        .respondWithData(testData.submissionOData));

    it('re-renders the table with the selected fields', () =>
      loadSubmissionList({ attachTo: document.body })
        .complete()
        .request(uncheckFirst)
        .beforeEachResponse(component => {
          component.findComponent(SubmissionDataRow).exists().should.be.false();
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const table = component.getComponent(SubmissionTable);
          table.findComponent(SubmissionDataRow).exists().should.be.true();
          table.props().fields.length.should.equal(9);
        }));
  });
});
