import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import ProjectOverview from '../../../src/components/project/overview.vue';

import { loadLocale } from '../../../src/util/i18n';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectShow', () => {
  it('requires the projectId route param to be integer', async () => {
    const app = await load('/projects/p');
    app.findComponent(NotFound).exists().should.be.true();
  });

  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings').testRequests([
      { url: '/v1/projects/1', extended: true }
    ]);
  });

  describe('requestData reconciliation', () => {
    beforeEach(mockLogin);

    it('reconciles project and forms', async () => {
      testData.extendedProjects.createPast(1, { forms: 1 });
      testData.extendedForms.createPast(2);
      const app = await load('/projects/1');
      app.vm.$store.state.request.data.project.forms.should.equal(2);
    });

    it('reconciles project and fieldKeys', async () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(2);
      const app = await load('/projects/1/app-users');
      app.vm.$store.state.request.data.project.appUsers.should.equal(2);
    });
  });

  it('re-renders the router view after a route change', () => {
    mockLogin();
    testData.extendedProjects.createPast(2);
    let vm;
    return load('/projects/1', {}, {
      project: () => testData.extendedProjects.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(ProjectOverview).vm;
      })
      .load('/projects/2', {
        project: () => testData.extendedProjects.last()
      })
      .afterResponses(app => {
        should(app.getComponent(ProjectOverview).vm).not.equal(vm);
      });
  });

  describe('title', () => {
    it("shows the project's name", async () => {
      mockLogin();
      testData.extendedProjects.createPast(1, { name: 'My Project' });
      const app = await load('/projects/1');
      app.get('#page-head-title').text().should.equal('My Project');
    });

    it("appends (archived) to an archived project's name", async () => {
      mockLogin();
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true
      });
      const app = await load('/projects/1');
      app.get('#page-head-title').text().should.equal('My Project (archived)');
    });

    it('updates (archived) after a locale change', async () => {
      mockLogin();
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true
      });
      const app = await load('/projects/1');
      const title = app.get('#page-head-title');
      title.text().should.equal('My Project (archived)');
      await loadLocale(app.vm.$container, 'es');
      await app.vm.$nextTick();
      title.text().should.equal('My Project (archivado)');
    });
  });

  describe('tabs', () => {
    it('shows the tabs to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1', { attachTo: document.body });
      const li = app.findAll('#page-head-tabs li');
      li.length.should.be.above(1);
      li[0].should.be.visible(true);
    });

    for (const role of ['viewer', 'formfill']) {
      it(`does not show the tabs to a ${role}`, async () => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role });
        const app = await load('/projects/1', { attachTo: document.body }, { deletedForms: false });
        const li = app.findAll('#page-head-tabs li');
        li.length.should.equal(1);
        li[0].should.be.hidden(true);
      });
    }
  });

  it('shows a loading message until response for project is received', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings')
      .beforeEachResponse(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading[0].props().state.should.equal(true);
      })
      .afterResponses(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading[0].props().state.should.equal(false);
      });
  });
});
