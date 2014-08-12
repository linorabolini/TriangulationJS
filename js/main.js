'use strict';

require.config({
    baseUrl: 'js/libs',
    paths: {
        'jquery': 'jquery-2.1.0.min',
        'underscore': 'underscore-min',
        'backbone': 'backbone-min',
        'two': 'two',
        'datgui': 'dat.gui'
    }
});

require(['jquery', 'underscore', 'backbone'],
    function () {
    // entry point

    });