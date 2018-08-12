import { AccountsTemplates } from 'meteor/useraccounts:core';
// import { TAPi18n } from 'meteor/tap:i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';

var myPostLogout = function(){
    //example redirect after logout
    FlowRouter.go('/');
};

var mySubmitFunc = function(error, state){
    if (!error) {
        if (state === "signIn") {
            // Successfully logged in
            // ...
        }
        if (state === "signUp") {
            // Successfully registered
            // ...
            var uid = Meteor.userId();
            Meteor.call('insert-new-setting', uid);
        }
    }
};

AccountsTemplates.configure({
    showForgotPasswordLink: true,
    texts: {
        errors: {
            loginForbidden: 'Incorrect username or password',
            pwdMismatch: 'Passwords don\'t match',
        },
        title: {
            signIn: 'Sign In',
            signUp: 'Register',
        },
    },
    defaultTemplate: 'Auth_page',
    defaultLayout: 'App_body',
    defaultContentRegion: 'main',
    defaultLayoutRegions: {},
    onLogoutHook: myPostLogout,
    onSubmitHook: mySubmitFunc,
});

AccountsTemplates.configureRoute('signIn', {
    name: 'login',
    path: '/login',
});

AccountsTemplates.configureRoute('signUp', {
    name: 'join',
    path: '/join',
});

AccountsTemplates.configureRoute('forgotPwd');

AccountsTemplates.configureRoute('resetPwd', {
    name: 'resetPwd',
    path: '/reset-password',
});

var pwd = AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');
AccountsTemplates.addFields([
    {
        _id: "username",
        type: "text",
        displayName: "username",
        required: true,
        minLength: 5,
    },
    {
        _id: "email",
        type: "email",
        required: true,
        displayName: "email",
        required: true,
        re: /.+@(.+){2,}\.(.+){2,}/,
        errStr: 'Invalid email',
    },
    pwd,
]);
