/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

export default class Presenter {
  constructor(data, i18n = undefined) {
    this._data = data;
    this.i18n = i18n;
  }

  get object() {
    return this._data;
  }

  with(data) {
    return new (this.constructor)({ ...this._data, ...data }, this.i18n);
  }
}

Presenter.define = (props) => {
  const klass = class extends Presenter {};

  // Add a getter for each property of the underlying data.
  for (const name of props) {
    Object.defineProperty(klass.prototype, name, {
      get() { return this._data[name]; }
    });
  }

  return klass;
};