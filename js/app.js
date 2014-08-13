define(function (require) {
    'use strict';
    var BB = require('backbone'),
        $ = require('jquery'),
        _ = require('underscore'),
        D = require('delaunay');

    var Filters = {};
    Filters.getPixels = function(img) {
        var c = this.getCanvas(img.width, img.height);
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0,0,c.width,c.height);
    };

    Filters.getCanvas = function(w,h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    };
    Filters.applyFilter= function(filter, image, var_args) {
      var args = [];
      for (var i=1; i<arguments.length; i++) {
        args.push(arguments[i]);
      }
      return filter.apply(null, args);
    };

    Filters.threshold = function(pixels, threshold) {
        var d = pixels.data;
        for (var i=0; i<d.length; i+=4) {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            var v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 0 : 255;
            d[i] = d[i+1] = d[i+2] = v
        }
        return pixels;
    };

    Filters.tmpCanvas = document.createElement('canvas');;
    Filters.tmpCtx = Filters.tmpCanvas.getContext('2d');

    Filters.createImageData = function(w,h) {
      return this.tmpCtx.createImageData(w,h);
    };

    Filters.convolute = function(pixels, weights, opaque) {
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side * 0.5);
        var src = pixels.data;
        var sw = pixels.width;
        var sh = pixels.height;
        // pad output by the convolution matrix
        var w = sw;
        var h = sh;
        var output = Filters.createImageData(w, h);
        var dst = output.data;
        // go through the destination image pixels
        var alphaFac = opaque ? 1 : 0;
        for (var y=0; y<h; y++) {
          for (var x=0; x<w; x++) {
            var sy = y;
            var sx = x;
            var dstOff = (y*w+x)*4;
            // calculate the weighed sum of the source image pixels that
            // fall under the convolution matrix
            var r=0, g=0, b=0, a=0;
            for (var cy=0; cy<side; cy++) {
              for (var cx=0; cx<side; cx++) {
                var scy = sy + cy - halfSide;
                var scx = sx + cx - halfSide;
                if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                  var srcOff = (scy*sw+scx)*4;
                  var wt = weights[cy*side+cx];
                  r += src[srcOff] * wt;
                  g += src[srcOff+1] * wt;
                  b += src[srcOff+2] * wt;
                  a += src[srcOff+3] * wt;
                }
              }
            }
            dst[dstOff] = r;
            dst[dstOff+1] = g;
            dst[dstOff+2] = b;
            dst[dstOff+3] = a + alphaFac*(255-a);
          }
        }
        return output;
    };

    return BB.View.extend({
        imageThreshold: 50,
        pointSearchDistance: 10,
        el: 'body',
        initialize: function () {

        },
        processImage: function (image) {
            this.canvas.width = image.width;
            this.canvas.height = image.height;

            var output = Filters.getPixels(image);
            output = Filters.applyFilter(Filters.convolute, output, [-1, -1, -1, -1,  8, -1, -1, -1, -1], 1);
            output = Filters.applyFilter(Filters.threshold, output, this.imageThreshold);

            // this can go to other function
            var points = this.getPoints(output, Math.floor(this.pointSearchDistance));
            var finalImage = this.ctx.getImageData(0, 0, image.width, image.height);

            // preview the points
            // var d = finalImage.data;
            // _.each(points, function(i) {
            //     d[i] = d[i+1] = d[i+2] = 0;
            //     d[i+3] = 255;
            // });

            var vertices = _.map(points, function (i) {
                var p = i * 0.25;
                return [p % image.width, Math.floor(p / image.width), i];
            });
            // console.log(vertices);

            console.time("triangulate");
            var triangles = D.triangulate(vertices);
            console.timeEnd("triangulate");

            var base = Filters.getPixels(image);
            var d = base.data;

            for(var i = triangles.length; i; ) {
              this.ctx.beginPath();
              --i; this.ctx.moveTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
              --i; this.ctx.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
              --i; this.ctx.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
              this.ctx.closePath();
              var v = vertices[triangles[i]][2];
              
              this.ctx.strokeStyle = this.ctx.fillStyle = "rgb("+ d[v] + "," + d[v+1] + "," + d[v+2] + ")";
              this.ctx.fill();
              this.ctx.stroke();
            }

        },
        getPoints: function (pixels, distance) {
            var points = [];

            var d = pixels.data;
            for (var i=0; i<d.length; i+=4) {
                var v = d[i];
                if(v === 0) {
                    points.push(i);
                }
                i += distance*4;
            }

            return points;
        },
        render: function () {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.$el.append(this.canvas);
            return this;
        }
    });
});