const appRoot = require('app-root-path');
const should = require('should');
const { testTask } = require('../setup');
const { purgeForms } = require(appRoot + '/lib/task/purge');
const { setConfiguration } = require(appRoot + '/lib/task/config');

// The basics of this task are tested here, including returning the count
// of purged forms, but the full functionality is more thoroughly tested in 
// test/integration/other/form-purging.js

describe('task: purge deleted forms', () => {
  it('should not purge recently deleted forms by default', testTask(({ Forms }) =>
    Forms.getByProjectAndXmlFormId(1, 'simple')
      .then((form) => Forms.del(form.get())
      .then(() => purgeForms())
      .then((count) => {
        count.should.equal(0);
      }))));

  it('should purge recently deleted form if forced', testTask(({ Forms }) =>
    Forms.getByProjectAndXmlFormId(1, 'simple')
      .then((form) => Forms.del(form.get())
      .then(() => purgeForms(true))
      .then((count) => {
        count.should.equal(1);
      }))));

  it('should return count for multiple forms purged', testTask(({ Forms }) =>
    Forms.getByProjectAndXmlFormId(1, 'simple')
      .then((form) => Forms.del(form.get())
      .then(() => Forms.getByProjectAndXmlFormId(1, 'withrepeat'))
      .then((form) => Forms.del(form.get())
      .then(() => purgeForms(true))
      .then((count) => {
        count.should.equal(2);
      })))));

  it('should not purge specific recently deleted form', testTask(({ Forms }) =>
    Forms.getByProjectAndXmlFormId(1, 'simple')
      .then((form) => Forms.del(form.get())
      .then(() => purgeForms(false, 1))
      .then((count) => {
        count.should.equal(0);
      }))));

  it('should purge specific recently deleted form if forced', testTask(({ Forms }) =>
    Forms.getByProjectAndXmlFormId(1, 'simple')
      .then((form) => Forms.del(form.get())
      .then(() => purgeForms(true, 1))
      .then((count) => {
        count.should.equal(1);
      }))));

  it('should force purge only specific form', testTask(({ Forms }) =>
    Forms.getByProjectAndXmlFormId(1, 'simple')
      .then((form) => Forms.del(form.get())
      .then(() => Forms.getByProjectAndXmlFormId(1, 'withrepeat'))
      .then((form) => Forms.del(form.get())
      .then(() => purgeForms(true, 1))
      .then((count) => {
        count.should.equal(1);
      })))));
});

