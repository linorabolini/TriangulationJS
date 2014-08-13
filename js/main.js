'use strict';

require.config({
    baseUrl: 'js',
    paths: {
        'jquery': 'libs/jquery-2.1.0.min',
        'underscore': 'libs/underscore-min',
        'backbone': 'libs/backbone-min',
        'two': 'libs/two',
        'datgui': 'libs/dat.gui',
        'app': 'app',
        'delaunay' : 'libs/delaunay'
    }
});

require(['jquery', 'underscore', 'backbone', 'app', 'datgui'],
    function ($, _, BB, App) {
        // entry point
        var app = new App().render(),
            gui = new dat.GUI(),
            f1 = gui.addFolder('Config'),
            f2 = gui.addFolder('Comands'),
            folders = [f1, f2];

        var img = document.getElementById('testImage');
        app.start = function () {
            app.processImage(img);
        };

        var controller = f1.add(app, 'imageThreshold', 1, 255);
        controller.onChange(app.start);
        controller = f1.add(app, 'pointSearchDistance', 0, 50);
        controller.onChange(app.start);
        f2.add(app, 'start');

        _.each(folders, function (f) { f.open(); });

    });