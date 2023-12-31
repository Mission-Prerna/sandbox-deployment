/*
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// Converts a string value or `null` to an OData literal value.
export const odataLiteral = (value) => (value != null
  ? `'${value.replaceAll("'", "''")}'`
  : 'null');

export const instanceNameOrId = (odata) => {
  const { meta } = odata;
  return meta != null && typeof meta.instanceName === 'string'
    ? meta.instanceName
    : odata.__id;
};
