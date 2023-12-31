<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <li id="navbar-locale-dropdown" class="dropdown">
    <a class="dropdown-toggle" href="#" data-toggle="dropdown" role="button"
      aria-haspopup="true" aria-expanded="false">
      {{ $i18n.locale }}<span class="caret"></span>
    </a>
    <ul class="dropdown-menu">
      <li v-for="[locale, name] of locales" :key="locale"
        :class="{ disabled: loading }">
        <a href="#" @click.prevent="loadLocale(locale)">{{ name }}</a>
      </li>
      <li class="divider" role="separator"></li>
      <li>
        <a href="https://docs.google.com/document/d/1C0MS_ytAEBHwbMkdR-QrtDrWAAh_EkJo2QRr4XyIOpk"
          target="_blank" rel="noopener">
          {{ $t('helpTranslate') }}
        </a>
      </li>
    </ul>
  </li>
</template>

<script>
import { loadLocale } from '../../util/i18n';
import { localStore } from '../../util/storage';
import { locales } from '../../i18n';
import { noop } from '../../util/util';

export default {
  name: 'NavbarLocaleDropdown',
  inject: ['container'],
  data() {
    return {
      loading: false
    };
  },
  computed: {
    locales() {
      return locales;
    }
  },
  methods: {
    loadLocale(locale) {
      this.loading = true;
      return loadLocale(this.container, locale)
        .then(() => {
          localStore.setItem('locale', locale);
        })
        .catch(noop)
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is shown below the list of languages and links to the ODK Central
    // translation guide.
    "helpTranslate": "Help translate Central"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "helpTranslate": "Nápověda k překladu Central"
  },
  "de": {
    "helpTranslate": "Hilf Central zu übersetzen"
  },
  "es": {
    "helpTranslate": "Ayuda a traducir Central"
  },
  "fr": {
    "helpTranslate": "Aider à traduire Central"
  },
  "id": {
    "helpTranslate": "Bantu terjemahan pusat"
  },
  "it": {
    "helpTranslate": "Aiuta a tradurre Central"
  },
  "ja": {
    "helpTranslate": "Centralの翻訳に貢献する"
  },
  "sw": {
    "helpTranslate": "Saidia kutafsiri Central"
  }
}
</i18n>
