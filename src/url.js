import _ from 'lodash-firecloud';
import urlLib from 'url';

export let parse = function(url) {
  // FIXME use url.URL when AWS Node.js is upgraded from 6.10
  return urlLib.parse(url, true, true);
};

export let format = function(url) {
  // FIXME use url.URL when AWS Node.js is upgraded from 6.10
  url = _.omit(url, [
    'host',
    'href',
    'path',
    'search'
  ]);

  return urlLib.format(url);
};
