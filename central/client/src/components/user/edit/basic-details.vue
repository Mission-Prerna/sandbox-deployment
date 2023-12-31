<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="user-edit-basic-details" class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('title') }}</h1>
    </div>
    <div class="panel-body">
      <form @submit.prevent="submit">
        <form-group v-model.trim="email" type="email"
          :placeholder="$t('field.email')" required autocomplete="off"/>
        <form-group v-model.trim="displayName" type="text"
          :placeholder="$t('field.displayName')" required autocomplete="off"/>
        <button :disabled="awaitingResponse" type="submit"
          class="btn btn-primary">
          {{ $t('action.update') }}<spinner :state="awaitingResponse"/>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import FormGroup from '../../form-group.vue';
import Spinner from '../../spinner.vue';
import request from '../../../mixins/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'UserEditBasicDetails',
  components: { FormGroup, Spinner },
  mixins: [request()],
  inject: ['alert'],
  data() {
    const { email, displayName } = this.$store.state.request.data.user;
    return {
      awaitingResponse: false,
      email,
      displayName
    };
  },
  // The component assumes that this data will exist when the component is
  // created.
  computed: requestData(['user']),
  methods: {
    submit() {
      this.request({
        method: 'PATCH',
        url: apiPaths.user(this.user.id),
        data: { email: this.email, displayName: this.displayName }
      })
        .then(response => {
          this.$store.commit('setData', {
            key: 'user',
            value: this.user.with(response.data)
          });
          this.alert.success(this.$t('alert.success'));
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "title": "Basic Details",
    "action": {
      "update": "Update details"
    },
    "alert": {
      "success": "User details saved!"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Základní podrobnosti",
    "action": {
      "update": "Aktualizovat podrobnosti"
    },
    "alert": {
      "success": "Detaily uživatele uloženy!"
    }
  },
  "de": {
    "title": "Basisinformationen",
    "action": {
      "update": "Details aktualisieren"
    },
    "alert": {
      "success": "Benutzerinformationen gespeichert!"
    }
  },
  "es": {
    "title": "Información básica",
    "action": {
      "update": "Actualizar información"
    },
    "alert": {
      "success": "Información de usuario guardada!"
    }
  },
  "fr": {
    "title": "Détails de base",
    "action": {
      "update": "Mettre à jour les détails"
    },
    "alert": {
      "success": "Détails de l'utilisateur sauvegardées !"
    }
  },
  "id": {
    "title": "Rincian Dasar",
    "action": {
      "update": "Rincian Pembaruan"
    },
    "alert": {
      "success": "Rincian pengguna tersimpan!"
    }
  },
  "it": {
    "title": "Dettagli di base",
    "action": {
      "update": "Aggiornare dettagli"
    },
    "alert": {
      "success": "Dettagli utente salvati!"
    }
  },
  "ja": {
    "title": "基本詳細",
    "action": {
      "update": "詳細の更新"
    },
    "alert": {
      "success": "ユーザー詳細の保存完了！"
    }
  },
  "sw": {
    "title": "Maelezo ya Msingi",
    "action": {
      "update": "Sasisha maelezo"
    },
    "alert": {
      "success": "Maelezo ya mtumiaji yamehifadhiwa!"
    }
  }
}
</i18n>
