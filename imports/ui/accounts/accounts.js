import './accounts.html'

import { Template } from 'meteor/templating';

Template['override-atPwdFormBtn'].replaces('atPwdFormBtn');
Template['override-atPwdForm'].replaces('atPwdForm');
Template['override-atTextInput'].replaces('atTextInput');
Template['override-atTitle'].replaces('atTitle');
Template['override-atError'].replaces('atError');

Meteor.methods({
    'getUserEmail'() {
        if (Meteor.isServer){
            this.unblock();
            console.log('get user email');
        }
    }
});