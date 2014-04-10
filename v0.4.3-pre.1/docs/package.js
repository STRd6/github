(function(pkg) {
  (function() {
  var annotateSourceURL, cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule, startsWith,
    __slice = [].slice;

  fileSeparator = '/';

  global = window;

  defaultEntryPoint = "main";

  circularGuard = {};

  rootModule = {
    path: ""
  };

  loadPath = function(parentModule, pkg, path) {
    var cache, localPath, module, normalizedPath;
    if (startsWith(path, '/')) {
      localPath = [];
    } else {
      localPath = parentModule.path.split(fileSeparator);
    }
    normalizedPath = normalizePath(path, localPath);
    cache = cacheFor(pkg);
    if (module = cache[normalizedPath]) {
      if (module === circularGuard) {
        throw "Circular dependency detected when requiring " + normalizedPath;
      }
    } else {
      cache[normalizedPath] = circularGuard;
      try {
        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);
      } finally {
        if (cache[normalizedPath] === circularGuard) {
          delete cache[normalizedPath];
        }
      }
    }
    return module.exports;
  };

  normalizePath = function(path, base) {
    var piece, result;
    if (base == null) {
      base = [];
    }
    base = base.concat(path.split(fileSeparator));
    result = [];
    while (base.length) {
      switch (piece = base.shift()) {
        case "..":
          result.pop();
          break;
        case "":
        case ".":
          break;
        default:
          result.push(piece);
      }
    }
    return result.join(fileSeparator);
  };

  loadPackage = function(pkg) {
    var path;
    path = pkg.entryPoint || defaultEntryPoint;
    return loadPath(rootModule, pkg, path);
  };

  loadModule = function(pkg, path) {
    var args, context, dirname, file, module, program, values;
    if (!(file = pkg.distribution[path])) {
      throw "Could not find file at " + path + " in " + pkg.name;
    }
    program = annotateSourceURL(file.content, pkg, path);
    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);
    module = {
      path: dirname,
      exports: {}
    };
    context = {
      require: generateRequireFn(pkg, module),
      global: global,
      module: module,
      exports: module.exports,
      PACKAGE: pkg,
      __filename: path,
      __dirname: dirname
    };
    args = Object.keys(context);
    values = args.map(function(name) {
      return context[name];
    });
    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);
    return module;
  };

  isPackage = function(path) {
    if (!(startsWith(path, fileSeparator) || startsWith(path, "." + fileSeparator) || startsWith(path, ".." + fileSeparator))) {
      return path.split(fileSeparator)[0];
    } else {
      return false;
    }
  };

  generateRequireFn = function(pkg, module) {
    if (module == null) {
      module = rootModule;
    }
    if (pkg.name == null) {
      pkg.name = "ROOT";
    }
    if (pkg.scopedName == null) {
      pkg.scopedName = "ROOT";
    }
    return function(path) {
      var otherPackage;
      if (isPackage(path)) {
        if (!(otherPackage = pkg.dependencies[path])) {
          throw "Package: " + path + " not found.";
        }
        if (otherPackage.name == null) {
          otherPackage.name = path;
        }
        if (otherPackage.scopedName == null) {
          otherPackage.scopedName = "" + pkg.scopedName + ":" + path;
        }
        return loadPackage(otherPackage);
      } else {
        return loadPath(module, pkg, path);
      }
    };
  };

  if (typeof exports !== "undefined" && exports !== null) {
    exports.generateFor = generateRequireFn;
  } else {
    global.Require = {
      generateFor: generateRequireFn
    };
  }

  startsWith = function(string, prefix) {
    return string.lastIndexOf(prefix, 0) === 0;
  };

  cacheFor = function(pkg) {
    if (pkg.cache) {
      return pkg.cache;
    }
    Object.defineProperty(pkg, "cache", {
      value: {}
    });
    return pkg.cache;
  };

  annotateSourceURL = function(program, pkg, path) {
    return "" + program + "\n//# sourceURL=" + pkg.scopedName + "/" + path;
  };

}).call(this);

//# sourceURL=main.coffee
  window.require = Require.generateFor(pkg);
})({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "mode": "100644",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "mode": "100644",
      "content": "github\n======\n\nGithub API for online IDEs\n",
      "type": "blob"
    },
    "api_generator.coffee.md": {
      "path": "api_generator.coffee.md",
      "mode": "100644",
      "content": "\nGenerate all those fun API verbs: `get`, `put`, `post`, `patch`, `delete`\n\nOur helpers need a root to base off of. The root is a function that returns a\nstring. The requester does the actual api calls, these just set it up easily.\n\n    ApiGenerator = (root, requester) ->\n\nConfigure the options for a request by stringifying any data to be added to the\nrequest body, and setting the appropriate type. `get` requests don't call this\nas the default type is `get` and they put their params in the querystring.\n\n      requestOptions = (type, data) ->\n        type: type\n        data: JSON.stringify(data)\n\nIf our request is absolute we use that url, otherwise we get the base url from\nour root and append the path. This allows us to follow HATEOS resource urls more\neasily.\n\n      api = (path, options) ->\n        if path.match /^http/\n          url = path\n        else\n          url = \"#{root()}/#{path}\"\n\n        requester url, options\n\nExpose the basic api method in our returned object.\n\n      api: api\n\n      get: (path, data) ->\n        api path, data: data\n\n      put: (path, data) ->\n        api(path, requestOptions(\"PUT\", data))\n\n      post: (path, data) ->\n        api(path, requestOptions(\"POST\", data))\n\n      patch: (path, data) ->\n        api path, requestOptions(\"PATCH\", data)\n\n`delete` is a keyword in JS, so I guess we'll go with all caps. We maybe should\ngo with all caps for everything, but it seems so loud.\n\n      DELETE: (path, data) ->\n        api path, requestOptions(\"DELETE\", data)\n\n    module.exports = ApiGenerator\n",
      "type": "blob"
    },
    "lib/util.coffee.md": {
      "path": "lib/util.coffee.md",
      "mode": "100644",
      "content": "Util\n====\n\n    module.exports =\n      defaults: (target, objects...) ->\n        for object in objects\n          for name of object\n            unless target.hasOwnProperty(name)\n              target[name] = object[name]\n\n        return target\n\n      extend: (target, sources...) ->\n        for source in sources\n          for name of source\n            target[name] = source[name]\n\n        return target\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Github\n======\n\n    Repository = require \"./repository\"\n    Observable = require \"observable\"\n\n    {defaults, extend} = require \"./lib/util\"\n\nGithub handles our connections to the Github API. May be optionally passed a\npromise that when fulfilled will set the authorization token.\n\n    Github = (tokenPromise) ->\n\nOur OAuth token for making API requests. We can still make anonymous requests\nwithout it.\n\n      token = null\n\n      tokenPromise?.then (tokenValue) ->\n        token = tokenValue\n\nHold an observable for the last request so we can track things like oauth scopes\nand rate limit.\n\n      lastRequest = Observable()\n\nMake a call to the github API. The path can be either a relative path such as\n`users/STRd6` or an absolute path like `https://api.github.com/users/octocat` or\n`user.url`.\n\nWe attach our `accessToken` if present.\n\n`api` returns a promise for easy chaining.\n\n      api = (path, options={}) ->\n        if path.match /^http/\n          url = path\n        else\n          url = \"https://api.github.com/#{path}\"\n\n        options.headers ||= {}\n\n        if token\n          options.headers[\"Authorization\"] = \"token #{token}\"\n\n        options = extend\n          url: url\n          type: \"GET\"\n          dataType: 'json'\n          contentType: \"application/json; charset=utf-8\"\n        , options\n\nPerform the ajax call and observe requests on success or failure\n\n        $.ajax(options).done (data, status, request) ->\n          lastRequest(request)\n        .fail lastRequest\n\nPublicly expose `api` method.\n\n      api: api\n\n`markdown` takes a string of source and returns a promise that will complete with\nthe rendered markdown by posting it to Github.\n\nSee also: http://developer.github.com/v3/markdown/\n\n      markdown: require('./markdown')(api)\n\nAlso expose `lastRequest`.\n\n      lastRequest: lastRequest\n\nGetter/Setter for auth token.\n\n      token: (newValue) ->\n        if arguments.length > 0\n          token = newValue\n        else\n          token\n\nExpose the `Repository` constructor so that others can create repositories from\nraw data.\n\n      Repository: (data={}) ->\n        # Use our api for the repository\n        defaults data,\n          requester: api\n\n        Repository(data)\n\nGet a repository, returns a promise that will have a repository one day.\n\n      repository: (fullName) ->\n        # TODO: Consider returning a repository proxy immediately\n        #   may need to be weighed carefully with the tradeoffs of observables.\n        # TODO: Consider creating from a full url in addition to a full name.\n\n        api(\"repos/#{fullName}\")\n        .then (data) ->\n          defaults data,\n            requester: api\n\n          Repository(data)\n\nExpose `authorizationUrl` to instances as well.\n\n      authorizationUrl: Github.authorizationUrl\n\nA URL that will authorize a user with the specified scope for the given app.\n\n    Github.authorizationUrl = (clientId, scope=\"user:email\") ->\n      \"https://github.com/login/oauth/authorize?client_id=#{clientId}&scope=#{scope}\"\n\n    module.exports = Github\n",
      "type": "blob"
    },
    "markdown.coffee.md": {
      "path": "markdown.coffee.md",
      "mode": "100644",
      "content": "Markdown\n========\n\nExpose Github's Markdown API.\n\n    module.exports = (api) ->\n      (source) ->\n        api \"markdown\",\n          type: \"POST\"\n          dataType: \"text\"\n          data: JSON.stringify\n            text: source\n            mode: \"markdown\"\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.4.3-pre.1\"\nremoteDependencies: [\n  \"https://code.jquery.com/jquery-1.11.0.min.js\"\n]\ndependencies:\n  emojer: \"STRd6/emojer:v0.2.0\"\n  observable: \"distri/observable:v0.1.1\"\n  composition: \"distri/compositions:v0.1.1\"\n",
      "type": "blob"
    },
    "repository.coffee.md": {
      "path": "repository.coffee.md",
      "mode": "100644",
      "content": "Repsoitory\n==========\n\n`Repository` wraps the concept of a Github repository. It includes additional\ndata for the local working copy such as the current branch.\n\nAll of the methods return promises to allow for easy chaining and error\nreporting.\n\n    ApiGenerator = require('./api_generator')\n    Composition = require \"composition\"\n    {defaults, extend} = require \"./lib/util\"\n\nAn emoji generator to make commits pop!\n\n    emojer = require \"emojer\"\n\n    emojis = ->\n      \"#{emojer()}#{emojer()}\"\n\nConstructor\n-----------\n\nCurrently the only parameter needed to initialize a repository instance is a\n`url`. This url is used as a base for the api calls.\n\n    Repository = (I={}) ->\n      defaults I,\n        branch: null\n        default_branch: \"master\"\n\n      # Requester only matters runtime, not real data\n      # TODO: This is kind of a hack\n      requester = I.requester\n      delete I.requester\n\n      self = Composition(I)\n\n      self.attrObservable Object.keys(I)...\n\n      # TODO: Think about converting underscored properties to camel case in an\n      # automatic and consistent way.\n\n      self.defaultBranch = ->\n        I.default_branch\n\n      # Initialize chosen branch to default branch\n      unless self.branch()\n        self.branch(self.defaultBranch())\n\nGet api helper methods from the api generator. With them we can do things like\n`get \"branches\"` to list branches of this repo.\n\n      {get, put, post, patch} = ApiGenerator self.url, requester\n\n      self.extend\n        infoDisplay: ->\n          \"#{I.fullName} (#{self.branch()})\"\n\n        pullRequests: ->\n          get \"pulls\"\n\n        createPullRequest: ({title}) ->\n          head = title.dasherize()\n\n          self.switchToBranch(head)\n          .then(self.commitEmpty)\n          .then ->\n            post \"pulls\",\n              base: self.defaultBranch()\n              head: head\n              title: title\n\n        latestCommit: (branch=self.branch()) ->\n          get(\"git/refs/heads/#{branch}#{cacheBuster()}\")\n          .then (data) ->\n            get data.object.url\n\n        latestContent: (branch=self.branch()) ->\n          self.latestCommit(branch)\n          .then (data) ->\n            get \"#{data.tree.url}?recursive=1\"\n          .then (data) ->\n            files = data.tree.select (file) ->\n              file.type is \"blob\"\n\n            # Gather the data for each file\n            $.when.apply(null, files.map (datum) ->\n              get(datum.url)\n              .then (data) ->\n                extend(datum, data)\n            )\n          .then (results...) ->\n            results\n\n        commitTree: ({branch, message, baseTree, tree, empty}) ->\n          branch ?= self.branch()\n          message ?= \"#{emojis()} Updated in browser at strd6.github.io/editor\"\n\n          # TODO: Is there a cleaner way to pass this through promises?\n          latestCommitSha = null\n\n          self.latestCommit(branch)\n          .then (data) ->\n            latestCommitSha = data.sha\n\n            if baseTree is true\n              baseTree = data.tree.sha\n\n            if empty is true\n              Deferred().resolve(data.tree)\n            else\n              # TODO: Github barfs when committing blank files\n              tree = tree.filter (file) ->\n                if file.content or file.sha\n                  true\n                else\n                  console.warn \"Blank content for: \", file\n                  false\n\n              post \"git/trees\",\n                base_tree: baseTree\n                tree: tree\n          .then (data) ->\n            # Create another commit\n            post \"git/commits\",\n              parents: [latestCommitSha]\n              message: message\n              tree: data.sha\n          .then (data) ->\n            # Update the branch head\n            patch \"git/refs/heads/#{branch}\",\n              sha: data.sha\n\n        # TODO: this is currently a hack because we can't create a pull request\n        # if there are no different commits\n        commitEmpty: ->\n          self.commitTree\n            empty: true\n            message: \"This commit intentionally left blank\"\n\nCreates ref (if it doesn't already exist) using our current branch as a base.\n\n        createRef: (ref) ->\n          get(\"git/refs/heads/#{self.branch()}\")\n          .then (data) ->\n            post \"git/refs\",\n              ref: ref\n              sha: data.object.sha\n\n        switchToBranch: (branch) ->\n          ref = \"refs/heads/#{branch}\"\n\n          setBranch = (data) ->\n            self.branch(branch)\n\n            return data\n\n          get(\"git/#{ref}\")\n          .then setBranch # Success\n          , (request) -> # Failure\n            branchNotFound = (request.status is 404)\n\n            if branchNotFound\n              self.createRef(ref)\n              .then(setBranch)\n            else\n              Deferred().reject(arguments...)\n\n        mergeInto: (branch=self.defaultBranch()) ->\n          post \"merges\",\n            base: branch\n            head: self.branch()\n\n        pullFromBranch: (branch=self.defaultBranch()) ->\n          post \"merges\",\n            base: self.branch()\n            head: branch\n\nThe default branch that we publish our packaged content to.\n\n        publishBranch: ->\n          \"gh-pages\"\n\nInitialize the publish branch, usually `gh-pages`. We create an empty\ntree and set it as a root commit (one with no parents). Then we create\nthe branch referencing that commit.\n\n        initPublishBranch: (branch=self.publishBranch()) ->\n          # Post an empty tree to use for the base commit\n          # TODO: Learn how to post an actually empty tree\n          post \"git/trees\",\n            tree: [{\n              content: \"created by strd6.github.io/editor\"\n              mode: \"100644\"\n              path: \"tempest.txt\"\n              type: \"blob\"\n            }]\n          .then (data) ->\n            post \"git/commits\",\n              message: \"Initial commit #{emojis()}\"\n              tree: data.sha\n          .then (data) ->\n            # Create the branch from the base commit\n            post \"git/refs\",\n              ref: \"refs/heads/#{branch}\"\n              sha: data.sha\n\nEnsure our publish branch exists. If it is found it returns a promise that\nsucceeds right away, otherwise it attempts to create it. Either way it\nreturns a promise that will be fullfilled if the publish branch is legit.\n\n        ensurePublishBranch: (publishBranch=self.publishBranch()) ->\n          get(\"branches/#{publishBranch}\")\n          .then null, (request) ->\n            if request.status is 404\n              self.initPublishBranch(publishBranch)\n\nPublish our package for distribution by taking a tree and adding it to the\n`gh-pages` branch after making sure that branch exists.\n\n        publish: (tree, ref=self.branch(), publishBranch=self.publishBranch()) ->\n          message = \"#{emojis()} Built #{ref} in browser in strd6.github.io/editor\"\n\n          self.ensurePublishBranch(publishBranch).then ->\n            self.commitTree\n              baseTree: true\n              tree: tree\n              branch: publishBranch\n\nExpose our API methods.\n\n      extend self,\n        get: get\n        put: put\n        post: post\n        patch: patch\n\n      return self\n\n    module.exports = Repository\n\nHelpers\n-------\n\n    cacheBuster = ->\n      \"?#{+ new Date}\"\n",
      "type": "blob"
    },
    "test/github.coffee.md": {
      "path": "test/github.coffee.md",
      "mode": "100644",
      "content": "Testing our Github API wrapper. Currently super hacky, but time heals all.\n\n    window.Github = require \"../main\"\n\n    describe \"Github\", ->\n      it \"Should be able to construct repositories\", ->\n        assert Github().repository\n\n        assert Github().Repository\n\n      it \"should have authorizationUrl as an instance method\", ->\n        assert Github().authorizationUrl\n\n      describe \"Repository\", ->\n\nHacky way to test requests. We just see if it returns a URL that looks ok.\n\n        expected = null\n        expectUrlToMatch = (regex) ->\n          expected = regex\n\n        testRequester = (url, data) ->\n          match = url.match(expected)\n          assert.equal !!match, true, \"\"\"\n            #{url} did not match #{expected}, #{match}\n          \"\"\"\n\n          then: ->\n\n        repository = Github().Repository\n          url: \"STRd6/testin\"\n          requester: testRequester\n\n        it \"should cache bust the latest commit\", ->\n          expectUrlToMatch /.*\\?\\d+/\n\n          repository.latestCommit()\n\n        it \"should create a merge when asked\", ->\n          expectUrlToMatch /STRd6\\/testin\\/merges/\n\n          repository.mergeInto()\n",
      "type": "blob"
    }
  },
  "distribution": {
    "api_generator": {
      "path": "api_generator",
      "content": "(function() {\n  var ApiGenerator;\n\n  ApiGenerator = function(root, requester) {\n    var api, requestOptions;\n    requestOptions = function(type, data) {\n      return {\n        type: type,\n        data: JSON.stringify(data)\n      };\n    };\n    api = function(path, options) {\n      var url;\n      if (path.match(/^http/)) {\n        url = path;\n      } else {\n        url = \"\" + (root()) + \"/\" + path;\n      }\n      return requester(url, options);\n    };\n    return {\n      api: api,\n      get: function(path, data) {\n        return api(path, {\n          data: data\n        });\n      },\n      put: function(path, data) {\n        return api(path, requestOptions(\"PUT\", data));\n      },\n      post: function(path, data) {\n        return api(path, requestOptions(\"POST\", data));\n      },\n      patch: function(path, data) {\n        return api(path, requestOptions(\"PATCH\", data));\n      },\n      DELETE: function(path, data) {\n        return api(path, requestOptions(\"DELETE\", data));\n      }\n    };\n  };\n\n  module.exports = ApiGenerator;\n\n}).call(this);\n",
      "type": "blob"
    },
    "lib/util": {
      "path": "lib/util",
      "content": "(function() {\n  var __slice = [].slice;\n\n  module.exports = {\n    defaults: function() {\n      var name, object, objects, target, _i, _len;\n      target = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      for (_i = 0, _len = objects.length; _i < _len; _i++) {\n        object = objects[_i];\n        for (name in object) {\n          if (!target.hasOwnProperty(name)) {\n            target[name] = object[name];\n          }\n        }\n      }\n      return target;\n    },\n    extend: function() {\n      var name, source, sources, target, _i, _len;\n      target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      for (_i = 0, _len = sources.length; _i < _len; _i++) {\n        source = sources[_i];\n        for (name in source) {\n          target[name] = source[name];\n        }\n      }\n      return target;\n    }\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "main": {
      "path": "main",
      "content": "(function() {\n  var Github, Observable, Repository, defaults, extend, _ref;\n\n  Repository = require(\"./repository\");\n\n  Observable = require(\"observable\");\n\n  _ref = require(\"./lib/util\"), defaults = _ref.defaults, extend = _ref.extend;\n\n  Github = function(tokenPromise) {\n    var api, lastRequest, token;\n    token = null;\n    if (tokenPromise != null) {\n      tokenPromise.then(function(tokenValue) {\n        return token = tokenValue;\n      });\n    }\n    lastRequest = Observable();\n    api = function(path, options) {\n      var url;\n      if (options == null) {\n        options = {};\n      }\n      if (path.match(/^http/)) {\n        url = path;\n      } else {\n        url = \"https://api.github.com/\" + path;\n      }\n      options.headers || (options.headers = {});\n      if (token) {\n        options.headers[\"Authorization\"] = \"token \" + token;\n      }\n      options = extend({\n        url: url,\n        type: \"GET\",\n        dataType: 'json',\n        contentType: \"application/json; charset=utf-8\"\n      }, options);\n      return $.ajax(options).done(function(data, status, request) {\n        return lastRequest(request);\n      }).fail(lastRequest);\n    };\n    return {\n      api: api,\n      markdown: require('./markdown')(api),\n      lastRequest: lastRequest,\n      token: function(newValue) {\n        if (arguments.length > 0) {\n          return token = newValue;\n        } else {\n          return token;\n        }\n      },\n      Repository: function(data) {\n        if (data == null) {\n          data = {};\n        }\n        defaults(data, {\n          requester: api\n        });\n        return Repository(data);\n      },\n      repository: function(fullName) {\n        return api(\"repos/\" + fullName).then(function(data) {\n          defaults(data, {\n            requester: api\n          });\n          return Repository(data);\n        });\n      },\n      authorizationUrl: Github.authorizationUrl\n    };\n  };\n\n  Github.authorizationUrl = function(clientId, scope) {\n    if (scope == null) {\n      scope = \"user:email\";\n    }\n    return \"https://github.com/login/oauth/authorize?client_id=\" + clientId + \"&scope=\" + scope;\n  };\n\n  module.exports = Github;\n\n}).call(this);\n",
      "type": "blob"
    },
    "markdown": {
      "path": "markdown",
      "content": "(function() {\n  module.exports = function(api) {\n    return function(source) {\n      return api(\"markdown\", {\n        type: \"POST\",\n        dataType: \"text\",\n        data: JSON.stringify({\n          text: source,\n          mode: \"markdown\"\n        })\n      });\n    };\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.4.3-pre.1\",\"remoteDependencies\":[\"https://code.jquery.com/jquery-1.11.0.min.js\"],\"dependencies\":{\"emojer\":\"STRd6/emojer:v0.2.0\",\"observable\":\"distri/observable:v0.1.1\",\"composition\":\"distri/compositions:v0.1.1\"}};",
      "type": "blob"
    },
    "repository": {
      "path": "repository",
      "content": "(function() {\n  var ApiGenerator, Composition, Repository, cacheBuster, defaults, emojer, emojis, extend, _ref,\n    __slice = [].slice;\n\n  ApiGenerator = require('./api_generator');\n\n  Composition = require(\"composition\");\n\n  _ref = require(\"./lib/util\"), defaults = _ref.defaults, extend = _ref.extend;\n\n  emojer = require(\"emojer\");\n\n  emojis = function() {\n    return \"\" + (emojer()) + (emojer());\n  };\n\n  Repository = function(I) {\n    var get, patch, post, put, requester, self, _ref1;\n    if (I == null) {\n      I = {};\n    }\n    defaults(I, {\n      branch: null,\n      default_branch: \"master\"\n    });\n    requester = I.requester;\n    delete I.requester;\n    self = Composition(I);\n    self.attrObservable.apply(self, Object.keys(I));\n    self.defaultBranch = function() {\n      return I.default_branch;\n    };\n    if (!self.branch()) {\n      self.branch(self.defaultBranch());\n    }\n    _ref1 = ApiGenerator(self.url, requester), get = _ref1.get, put = _ref1.put, post = _ref1.post, patch = _ref1.patch;\n    self.extend({\n      infoDisplay: function() {\n        return \"\" + I.fullName + \" (\" + (self.branch()) + \")\";\n      },\n      pullRequests: function() {\n        return get(\"pulls\");\n      },\n      createPullRequest: function(_arg) {\n        var head, title;\n        title = _arg.title;\n        head = title.dasherize();\n        return self.switchToBranch(head).then(self.commitEmpty).then(function() {\n          return post(\"pulls\", {\n            base: self.defaultBranch(),\n            head: head,\n            title: title\n          });\n        });\n      },\n      latestCommit: function(branch) {\n        if (branch == null) {\n          branch = self.branch();\n        }\n        return get(\"git/refs/heads/\" + branch + (cacheBuster())).then(function(data) {\n          return get(data.object.url);\n        });\n      },\n      latestContent: function(branch) {\n        if (branch == null) {\n          branch = self.branch();\n        }\n        return self.latestCommit(branch).then(function(data) {\n          return get(\"\" + data.tree.url + \"?recursive=1\");\n        }).then(function(data) {\n          var files;\n          files = data.tree.select(function(file) {\n            return file.type === \"blob\";\n          });\n          return $.when.apply(null, files.map(function(datum) {\n            return get(datum.url).then(function(data) {\n              return extend(datum, data);\n            });\n          }));\n        }).then(function() {\n          var results;\n          results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return results;\n        });\n      },\n      commitTree: function(_arg) {\n        var baseTree, branch, empty, latestCommitSha, message, tree;\n        branch = _arg.branch, message = _arg.message, baseTree = _arg.baseTree, tree = _arg.tree, empty = _arg.empty;\n        if (branch == null) {\n          branch = self.branch();\n        }\n        if (message == null) {\n          message = \"\" + (emojis()) + \" Updated in browser at strd6.github.io/editor\";\n        }\n        latestCommitSha = null;\n        return self.latestCommit(branch).then(function(data) {\n          latestCommitSha = data.sha;\n          if (baseTree === true) {\n            baseTree = data.tree.sha;\n          }\n          if (empty === true) {\n            return Deferred().resolve(data.tree);\n          } else {\n            tree = tree.filter(function(file) {\n              if (file.content || file.sha) {\n                return true;\n              } else {\n                console.warn(\"Blank content for: \", file);\n                return false;\n              }\n            });\n            return post(\"git/trees\", {\n              base_tree: baseTree,\n              tree: tree\n            });\n          }\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            parents: [latestCommitSha],\n            message: message,\n            tree: data.sha\n          });\n        }).then(function(data) {\n          return patch(\"git/refs/heads/\" + branch, {\n            sha: data.sha\n          });\n        });\n      },\n      commitEmpty: function() {\n        return self.commitTree({\n          empty: true,\n          message: \"This commit intentionally left blank\"\n        });\n      },\n      createRef: function(ref) {\n        return get(\"git/refs/heads/\" + (self.branch())).then(function(data) {\n          return post(\"git/refs\", {\n            ref: ref,\n            sha: data.object.sha\n          });\n        });\n      },\n      switchToBranch: function(branch) {\n        var ref, setBranch;\n        ref = \"refs/heads/\" + branch;\n        setBranch = function(data) {\n          self.branch(branch);\n          return data;\n        };\n        return get(\"git/\" + ref).then(setBranch, function(request) {\n          var branchNotFound, _ref2;\n          branchNotFound = request.status === 404;\n          if (branchNotFound) {\n            return self.createRef(ref).then(setBranch);\n          } else {\n            return (_ref2 = Deferred()).reject.apply(_ref2, arguments);\n          }\n        });\n      },\n      mergeInto: function(branch) {\n        if (branch == null) {\n          branch = self.defaultBranch();\n        }\n        return post(\"merges\", {\n          base: branch,\n          head: self.branch()\n        });\n      },\n      pullFromBranch: function(branch) {\n        if (branch == null) {\n          branch = self.defaultBranch();\n        }\n        return post(\"merges\", {\n          base: self.branch(),\n          head: branch\n        });\n      },\n      publishBranch: function() {\n        return \"gh-pages\";\n      },\n      initPublishBranch: function(branch) {\n        if (branch == null) {\n          branch = self.publishBranch();\n        }\n        return post(\"git/trees\", {\n          tree: [\n            {\n              content: \"created by strd6.github.io/editor\",\n              mode: \"100644\",\n              path: \"tempest.txt\",\n              type: \"blob\"\n            }\n          ]\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            message: \"Initial commit \" + (emojis()),\n            tree: data.sha\n          });\n        }).then(function(data) {\n          return post(\"git/refs\", {\n            ref: \"refs/heads/\" + branch,\n            sha: data.sha\n          });\n        });\n      },\n      ensurePublishBranch: function(publishBranch) {\n        if (publishBranch == null) {\n          publishBranch = self.publishBranch();\n        }\n        return get(\"branches/\" + publishBranch).then(null, function(request) {\n          if (request.status === 404) {\n            return self.initPublishBranch(publishBranch);\n          }\n        });\n      },\n      publish: function(tree, ref, publishBranch) {\n        var message;\n        if (ref == null) {\n          ref = self.branch();\n        }\n        if (publishBranch == null) {\n          publishBranch = self.publishBranch();\n        }\n        message = \"\" + (emojis()) + \" Built \" + ref + \" in browser in strd6.github.io/editor\";\n        return self.ensurePublishBranch(publishBranch).then(function() {\n          return self.commitTree({\n            baseTree: true,\n            tree: tree,\n            branch: publishBranch\n          });\n        });\n      }\n    });\n    extend(self, {\n      get: get,\n      put: put,\n      post: post,\n      patch: patch\n    });\n    return self;\n  };\n\n  module.exports = Repository;\n\n  cacheBuster = function() {\n    return \"?\" + (+(new Date));\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "test/github": {
      "path": "test/github",
      "content": "(function() {\n  window.Github = require(\"../main\");\n\n  describe(\"Github\", function() {\n    it(\"Should be able to construct repositories\", function() {\n      assert(Github().repository);\n      return assert(Github().Repository);\n    });\n    it(\"should have authorizationUrl as an instance method\", function() {\n      return assert(Github().authorizationUrl);\n    });\n    return describe(\"Repository\", function() {\n      var expectUrlToMatch, expected, repository, testRequester;\n      expected = null;\n      expectUrlToMatch = function(regex) {\n        return expected = regex;\n      };\n      testRequester = function(url, data) {\n        var match;\n        match = url.match(expected);\n        assert.equal(!!match, true, \"\" + url + \" did not match \" + expected + \", \" + match);\n        return {\n          then: function() {}\n        };\n      };\n      repository = Github().Repository({\n        url: \"STRd6/testin\",\n        requester: testRequester\n      });\n      it(\"should cache bust the latest commit\", function() {\n        expectUrlToMatch(/.*\\?\\d+/);\n        return repository.latestCommit();\n      });\n      return it(\"should create a merge when asked\", function() {\n        expectUrlToMatch(/STRd6\\/testin\\/merges/);\n        return repository.mergeInto();\n      });\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.4.3-pre.1",
  "entryPoint": "main",
  "remoteDependencies": [
    "https://code.jquery.com/jquery-1.11.0.min.js"
  ],
  "repository": {
    "id": 12910229,
    "name": "github",
    "full_name": "distri/github",
    "owner": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "private": false,
    "html_url": "https://github.com/distri/github",
    "description": "Github API for online IDEs",
    "fork": false,
    "url": "https://api.github.com/repos/distri/github",
    "forks_url": "https://api.github.com/repos/distri/github/forks",
    "keys_url": "https://api.github.com/repos/distri/github/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/distri/github/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/distri/github/teams",
    "hooks_url": "https://api.github.com/repos/distri/github/hooks",
    "issue_events_url": "https://api.github.com/repos/distri/github/issues/events{/number}",
    "events_url": "https://api.github.com/repos/distri/github/events",
    "assignees_url": "https://api.github.com/repos/distri/github/assignees{/user}",
    "branches_url": "https://api.github.com/repos/distri/github/branches{/branch}",
    "tags_url": "https://api.github.com/repos/distri/github/tags",
    "blobs_url": "https://api.github.com/repos/distri/github/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/distri/github/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/distri/github/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/distri/github/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/distri/github/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/distri/github/languages",
    "stargazers_url": "https://api.github.com/repos/distri/github/stargazers",
    "contributors_url": "https://api.github.com/repos/distri/github/contributors",
    "subscribers_url": "https://api.github.com/repos/distri/github/subscribers",
    "subscription_url": "https://api.github.com/repos/distri/github/subscription",
    "commits_url": "https://api.github.com/repos/distri/github/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/distri/github/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/distri/github/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/distri/github/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/distri/github/contents/{+path}",
    "compare_url": "https://api.github.com/repos/distri/github/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/distri/github/merges",
    "archive_url": "https://api.github.com/repos/distri/github/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/distri/github/downloads",
    "issues_url": "https://api.github.com/repos/distri/github/issues{/number}",
    "pulls_url": "https://api.github.com/repos/distri/github/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/distri/github/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/distri/github/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/distri/github/labels{/name}",
    "releases_url": "https://api.github.com/repos/distri/github/releases{/id}",
    "created_at": "2013-09-18T00:25:56Z",
    "updated_at": "2014-04-05T23:19:00Z",
    "pushed_at": "2014-04-05T23:18:58Z",
    "git_url": "git://github.com/distri/github.git",
    "ssh_url": "git@github.com:distri/github.git",
    "clone_url": "https://github.com/distri/github.git",
    "svn_url": "https://github.com/distri/github",
    "homepage": null,
    "size": 824,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": "CoffeeScript",
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 1,
    "forks": 0,
    "open_issues": 1,
    "watchers": 0,
    "default_branch": "master",
    "master_branch": "master",
    "permissions": {
      "admin": true,
      "push": true,
      "pull": true
    },
    "organization": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "network_count": 0,
    "subscribers_count": 1,
    "branch": "v0.4.3-pre.1",
    "publishBranch": "gh-pages"
  },
  "dependencies": {
    "emojer": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2013 CanastaNasty\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "emojer\n======\n\nRandomly returns a Github emoji\n",
          "type": "blob"
        },
        "main.js": {
          "path": "main.js",
          "mode": "100644",
          "content": "var emojis = \n  [\":bowtie:\"\n\t,\":smile:\"\n\t,\":laughing:\"\n\t,\":blush:\"\n\t,\":smiley:\"\n\t,\":relaxed:\"\n\t,\":smirk:\"\n\t,\":heart_eyes:\"\n\t,\":kissing_heart:\"\n\t,\":kissing_closed_eyes:\"\n\t,\":flushed:\"\n\t,\":relieved:\"\n\t,\":satisfied:\"\n\t,\":grin:\"\n\t,\":wink:\"\n\t,\":stuck_out_tongue_winking_eye:\"\n\t,\":stuck_out_tongue_closed_eyes:\"\n\t,\":grinning:\"\n\t,\":kissing:\"\n\t,\":kissing_smiling_eyes:\"\n\t,\":stuck_out_tongue:\"\n\t,\":sleeping:\"\n\t,\":worried:\"\n\t,\":frowning:\"\n\t,\":anguished:\"\n\t,\":open_mouth:\"\n\t,\":grimacing:\"\n\t,\":confused:\"\n\t,\":hushed:\"\n\t,\":expressionless:\"\n\t,\":unamused:\"\n\t,\":sweat_smile:\"\n\t,\":sweat:\"\n\t,\":disappointed_relieved:\"\n\t,\":weary:\"\n\t,\":pensive:\"\n\t,\":disappointed:\"\n\t,\":confounded:\"\n\t,\":fearful:\"\n\t,\":cold_sweat:\"\n\t,\":persevere:\"\n\t,\":cry:\"\n\t,\":sob:\"\n\t,\":joy:\"\n\t,\":astonished:\"\n\t,\":scream:\"\n\t,\":neckbeard:\"\n\t,\":tired_face:\"\n\t,\":angry:\"\n\t,\":rage:\"\n\t,\":triumph:\"\n\t,\":sleepy:\"\n\t,\":yum:\"\n\t,\":mask:\"\n\t,\":sunglasses:\"\n\t,\":dizzy_face:\"\n\t,\":imp:\"\n\t,\":smiling_imp:\"\n\t,\":neutral_face:\"\n\t,\":no_mouth:\"\n\t,\":innocent:\"\n\t,\":alien:\"\n\t,\":yellow_heart:\"\n\t,\":blue_heart:\"\n\t,\":purple_heart:\"\n\t,\":heart:\"\n\t,\":green_heart:\"\n\t,\":broken_heart:\"\n\t,\":heartbeat:\"\n\t,\":heartpulse:\"\n\t,\":two_hearts:\"\n\t,\":revolving_hearts:\"\n\t,\":cupid:\"\n\t,\":sparkling_heart:\"\n\t,\":sparkles:\"\n\t,\":star:\"\n\t,\":star2:\"\n\t,\":dizzy:\"\n\t,\":boom:\"\n\t,\":collision:\"\n\t,\":anger:\"\n\t,\":exclamation:\"\n\t,\":question:\"\n\t,\":grey_exclamation:\"\n\t,\":grey_question:\"\n\t,\":zzz:\"\n\t,\":dash:\"\n\t,\":sweat_drops:\"\n\t,\":notes:\"\n\t,\":musical_note:\"\n\t,\":fire:\"\n\t,\":hankey:\"\n\t,\":poop:\"\n\t,\":shit:\"\n\t,\":+1:\"\n\t,\":thumbsup:\"\n\t,\":-1:\"\n\t,\":thumbsdown:\"\n\t,\":ok_hand:\"\n\t,\":punch:\"\n\t,\":facepunch:\"\n\t,\":fist:\"\n\t,\":v:\"\n\t,\":wave:\"\n\t,\":hand:\"\n\t,\":raised_hand:\"\n\t,\":open_hands:\"\n\t,\":point_up:\"\n\t,\":point_down:\"\n\t,\":point_left:\"\n\t,\":point_right:\"\n\t,\":raised_hands:\"\n\t,\":pray:\"\n\t,\":point_up_2:\"\n\t,\":clap:\"\n\t,\":muscle:\"\n\t,\":metal:\"\n\t,\":fu:\"\n\t,\":walking:\"\n\t,\":runner:\"\n\t,\":running:\"\n\t,\":couple:\"\n\t,\":family:\"\n\t,\":two_men_holding_hands:\"\n\t,\":two_women_holding_hands:\"\n\t,\":dancer:\"\n\t,\":dancers:\"\n\t,\":ok_woman:\"\n\t,\":no_good:\"\n\t,\":information_desk_person:\"\n\t,\":raising_hand:\"\n\t,\":bride_with_veil:\"\n\t,\":person_with_pouting_face:\"\n\t,\":person_frowning:\"\n\t,\":bow:\"\n\t,\":couplekiss:\"\n\t,\":couple_with_heart:\"\n\t,\":massage:\"\n\t,\":haircut:\"\n\t,\":nail_care:\"\n\t,\":boy:\"\n\t,\":girl:\"\n\t,\":woman:\"\n\t,\":man:\"\n\t,\":baby:\"\n\t,\":older_woman:\"\n\t,\":older_man:\"\n\t,\":person_with_blond_hair:\"\n\t,\":man_with_gua_pi_mao:\"\n\t,\":man_with_turban:\"\n\t,\":construction_worker:\"\n\t,\":cop:\"\n\t,\":angel:\"\n\t,\":princess:\"\n\t,\":smiley_cat:\"\n\t,\":smile_cat:\"\n\t,\":heart_eyes_cat:\"\n\t,\":kissing_cat:\"\n\t,\":smirk_cat:\"\n\t,\":scream_cat:\"\n\t,\":crying_cat_face:\"\n\t,\":joy_cat:\"\n\t,\":pouting_cat:\"\n\t,\":japanese_ogre:\"\n\t,\":japanese_goblin:\"\n\t,\":see_no_evil:\"\n\t,\":hear_no_evil:\"\n\t,\":speak_no_evil:\"\n\t,\":guardsman:\"\n\t,\":skull:\"\n\t,\":feet:\"\n\t,\":lips:\"\n\t,\":kiss:\"\n\t,\":droplet:\"\n\t,\":ear:\"\n\t,\":eyes:\"\n\t,\":nose:\"\n\t,\":tongue:\"\n\t,\":love_letter:\"\n\t,\":bust_in_silhouette:\"\n\t,\":busts_in_silhouette:\"\n\t,\":speech_balloon:\"\n\t,\":thought_balloon:\"\n\t,\":feelsgood:\"\n\t,\":finnadie:\"\n\t,\":goberserk:\"\n\t,\":godmode:\"\n\t,\":hurtrealbad:\"\n\t,\":rage1:\"\n\t,\":rage2:\"\n\t,\":rage3:\"\n\t,\":rage4:\"\n\t,\":suspect:\"\n\t,\":trollface:\"\n\t,\":sunny:\"\n\t,\":umbrella:\"\n\t,\":cloud:\"\n\t,\":snowflake:\"\n\t,\":snowman:\"\n\t,\":zap:\"\n\t,\":cyclone:\"\n\t,\":foggy:\"\n\t,\":ocean:\"\n\t,\":cat:\"\n\t,\":dog:\"\n\t,\":mouse:\"\n\t,\":hamster:\"\n\t,\":rabbit:\"\n\t,\":wolf:\"\n\t,\":frog:\"\n\t,\":tiger:\"\n\t,\":koala:\"\n\t,\":bear:\"\n\t,\":pig:\"\n\t,\":pig_nose:\"\n\t,\":cow:\"\n\t,\":boar:\"\n\t,\":monkey_face:\"\n\t,\":monkey:\"\n\t,\":horse:\"\n\t,\":racehorse:\"\n\t,\":camel:\"\n\t,\":sheep:\"\n\t,\":elephant:\"\n\t,\":panda_face:\"\n\t,\":snake:\"\n\t,\":bird:\"\n\t,\":baby_chick:\"\n\t,\":hatched_chick:\"\n\t,\":hatching_chick:\"\n\t,\":chicken:\"\n\t,\":penguin:\"\n\t,\":turtle:\"\n\t,\":bug:\"\n\t,\":honeybee:\"\n\t,\":ant:\"\n\t,\":beetle:\"\n\t,\":snail:\"\n\t,\":octopus:\"\n\t,\":tropical_fish:\"\n\t,\":fish:\"\n\t,\":whale:\"\n\t,\":whale2:\"\n\t,\":dolphin:\"\n\t,\":cow2:\"\n\t,\":ram:\"\n\t,\":rat:\"\n\t,\":water_buffalo:\"\n\t,\":tiger2:\"\n\t,\":rabbit2:\"\n\t,\":dragon:\"\n\t,\":goat:\"\n\t,\":rooster:\"\n\t,\":dog2:\"\n\t,\":pig2:\"\n\t,\":mouse2:\"\n\t,\":ox:\"\n\t,\":dragon_face:\"\n\t,\":blowfish:\"\n\t,\":crocodile:\"\n\t,\":dromedary_camel:\"\n\t,\":leopard:\"\n\t,\":cat2:\"\n\t,\":poodle:\"\n\t,\":paw_prints:\"\n\t,\":bouquet:\"\n\t,\":cherry_blossom:\"\n\t,\":tulip:\"\n\t,\":four_leaf_clover:\"\n\t,\":rose:\"\n\t,\":sunflower:\"\n\t,\":hibiscus:\"\n\t,\":maple_leaf:\"\n\t,\":leaves:\"\n\t,\":fallen_leaf:\"\n\t,\":herb:\"\n\t,\":mushroom:\"\n\t,\":cactus:\"\n\t,\":palm_tree:\"\n\t,\":evergreen_tree:\"\n\t,\":deciduous_tree:\"\n\t,\":chestnut:\"\n\t,\":seedling:\"\n\t,\":blossom:\"\n\t,\":ear_of_rice:\"\n\t,\":shell:\"\n\t,\":globe_with_meridians:\"\n\t,\":sun_with_face:\"\n\t,\":full_moon_with_face:\"\n\t,\":new_moon_with_face:\"\n\t,\":new_moon:\"\n\t,\":waxing_crescent_moon:\"\n\t,\":first_quarter_moon:\"\n\t,\":waxing_gibbous_moon:\"\n\t,\":full_moon:\"\n\t,\":waning_gibbous_moon:\"\n\t,\":last_quarter_moon:\"\n\t,\":waning_crescent_moon:\"\n\t,\":last_quarter_moon_with_face:\"\n\t,\":first_quarter_moon_with_face:\"\n\t,\":moon:\"\n\t,\":earth_africa:\"\n\t,\":earth_americas:\"\n\t,\":earth_asia:\"\n\t,\":volcano:\"\n\t,\":milky_way:\"\n\t,\":partly_sunny:\"\n\t,\":octocat:\"\n\t,\":squirrel:\"\n\t,\":bamboo:\"\n\t,\":gift_heart:\"\n\t,\":dolls:\"\n\t,\":school_satchel:\"\n\t,\":mortar_board:\"\n\t,\":flags:\"\n\t,\":fireworks:\"\n\t,\":sparkler:\"\n\t,\":wind_chime:\"\n\t,\":rice_scene:\"\n\t,\":jack_o_lantern:\"\n\t,\":ghost:\"\n\t,\":santa:\"\n\t,\":christmas_tree:\"\n\t,\":gift:\"\n\t,\":bell:\"\n\t,\":no_bell:\"\n\t,\":tanabata_tree:\"\n\t,\":tada:\"\n\t,\":confetti_ball:\"\n\t,\":balloon:\"\n\t,\":crystal_ball:\"\n\t,\":cd:\"\n\t,\":dvd:\"\n\t,\":floppy_disk:\"\n\t,\":camera:\"\n\t,\":video_camera:\"\n\t,\":movie_camera:\"\n\t,\":computer:\"\n\t,\":tv:\"\n\t,\":iphone:\"\n\t,\":phone:\"\n\t,\":telephone:\"\n\t,\":telephone_receiver:\"\n\t,\":pager:\"\n\t,\":fax:\"\n\t,\":minidisc:\"\n\t,\":vhs:\"\n\t,\":sound:\"\n\t,\":speaker:\"\n\t,\":mute:\"\n\t,\":loudspeaker:\"\n\t,\":mega:\"\n\t,\":hourglass:\"\n\t,\":hourglass_flowing_sand:\"\n\t,\":alarm_clock:\"\n\t,\":watch:\"\n\t,\":radio:\"\n\t,\":satellite:\"\n\t,\":loop:\"\n\t,\":mag:\"\n\t,\":mag_right:\"\n\t,\":unlock:\"\n\t,\":lock:\"\n\t,\":lock_with_ink_pen:\"\n\t,\":closed_lock_with_key:\"\n\t,\":key:\"\n\t,\":bulb:\"\n\t,\":flashlight:\"\n\t,\":high_brightness:\"\n\t,\":low_brightness:\"\n\t,\":electric_plug:\"\n\t,\":battery:\"\n\t,\":calling:\"\n\t,\":email:\"\n\t,\":mailbox:\"\n\t,\":postbox:\"\n\t,\":bath:\"\n\t,\":bathtub:\"\n\t,\":shower:\"\n\t,\":toilet:\"\n\t,\":wrench:\"\n\t,\":nut_and_bolt:\"\n\t,\":hammer:\"\n\t,\":seat:\"\n\t,\":moneybag:\"\n\t,\":yen:\"\n\t,\":dollar:\"\n\t,\":pound:\"\n\t,\":euro:\"\n\t,\":credit_card:\"\n\t,\":money_with_wings:\"\n\t,\":e-mail:\"\n\t,\":inbox_tray:\"\n\t,\":outbox_tray:\"\n\t,\":envelope:\"\n\t,\":incoming_envelope:\"\n\t,\":postal_horn:\"\n\t,\":mailbox_closed:\"\n\t,\":mailbox_with_mail:\"\n\t,\":mailbox_with_no_mail:\"\n\t,\":door:\"\n\t,\":smoking:\"\n\t,\":bomb:\"\n\t,\":gun:\"\n\t,\":hocho:\"\n\t,\":pill:\"\n\t,\":syringe:\"\n\t,\":page_facing_up:\"\n\t,\":page_with_curl:\"\n\t,\":bookmark_tabs:\"\n\t,\":bar_chart:\"\n\t,\":chart_with_upwards_trend:\"\n\t,\":chart_with_downwards_trend:\"\n\t,\":scroll:\"\n\t,\":clipboard:\"\n\t,\":calendar:\"\n\t,\":date:\"\n\t,\":card_index:\"\n\t,\":file_folder:\"\n\t,\":open_file_folder:\"\n\t,\":scissors:\"\n\t,\":pushpin:\"\n\t,\":paperclip:\"\n\t,\":black_nib:\"\n\t,\":pencil2:\"\n\t,\":straight_ruler:\"\n\t,\":triangular_ruler:\"\n\t,\":closed_book:\"\n\t,\":green_book:\"\n\t,\":blue_book:\"\n\t,\":orange_book:\"\n\t,\":notebook:\"\n\t,\":notebook_with_decorative_cover:\"\n\t,\":ledger:\"\n\t,\":books:\"\n\t,\":bookmark:\"\n\t,\":name_badge:\"\n\t,\":microscope:\"\n\t,\":telescope:\"\n\t,\":newspaper:\"\n\t,\":football:\"\n\t,\":basketball:\"\n\t,\":soccer:\"\n\t,\":baseball:\"\n\t,\":tennis:\"\n\t,\":8ball:\"\n\t,\":rugby_football:\"\n\t,\":bowling:\"\n\t,\":golf:\"\n\t,\":mountain_bicyclist:\"\n\t,\":bicyclist:\"\n\t,\":horse_racing:\"\n\t,\":snowboarder:\"\n\t,\":swimmer:\"\n\t,\":surfer:\"\n\t,\":ski:\"\n\t,\":spades:\"\n\t,\":hearts:\"\n\t,\":clubs:\"\n\t,\":diamonds:\"\n\t,\":gem:\"\n\t,\":ring:\"\n\t,\":trophy:\"\n\t,\":musical_score:\"\n\t,\":musical_keyboard:\"\n\t,\":violin:\"\n\t,\":space_invader:\"\n\t,\":video_game:\"\n\t,\":black_joker:\"\n\t,\":flower_playing_cards:\"\n\t,\":game_die:\"\n\t,\":dart:\"\n\t,\":mahjong:\"\n\t,\":clapper:\"\n\t,\":memo:\"\n\t,\":pencil:\"\n\t,\":book:\"\n\t,\":art:\"\n\t,\":microphone:\"\n\t,\":headphones:\"\n\t,\":trumpet:\"\n\t,\":saxophone:\"\n\t,\":guitar:\"\n\t,\":shoe:\"\n\t,\":sandal:\"\n\t,\":high_heel:\"\n\t,\":lipstick:\"\n\t,\":boot:\"\n\t,\":shirt:\"\n\t,\":tshirt:\"\n\t,\":necktie:\"\n\t,\":womans_clothes:\"\n\t,\":dress:\"\n\t,\":running_shirt_with_sash:\"\n\t,\":jeans:\"\n\t,\":kimono:\"\n\t,\":bikini:\"\n\t,\":ribbon:\"\n\t,\":tophat:\"\n\t,\":crown:\"\n\t,\":womans_hat:\"\n\t,\":mans_shoe:\"\n\t,\":closed_umbrella:\"\n\t,\":briefcase:\"\n\t,\":handbag:\"\n\t,\":pouch:\"\n\t,\":purse:\"\n\t,\":eyeglasses:\"\n\t,\":fishing_pole_and_fish:\"\n\t,\":coffee:\"\n\t,\":tea:\"\n\t,\":sake:\"\n\t,\":baby_bottle:\"\n\t,\":beer:\"\n\t,\":beers:\"\n\t,\":cocktail:\"\n\t,\":tropical_drink:\"\n\t,\":wine_glass:\"\n\t,\":fork_and_knife:\"\n\t,\":pizza:\"\n\t,\":hamburger:\"\n\t,\":fries:\"\n\t,\":poultry_leg:\"\n\t,\":meat_on_bone:\"\n\t,\":spaghetti:\"\n\t,\":curry:\"\n\t,\":fried_shrimp:\"\n\t,\":bento:\"\n\t,\":sushi:\"\n\t,\":fish_cake:\"\n\t,\":rice_ball:\"\n\t,\":rice_cracker:\"\n\t,\":rice:\"\n\t,\":ramen:\"\n\t,\":stew:\"\n\t,\":oden:\"\n\t,\":dango:\"\n\t,\":egg:\"\n\t,\":bread:\"\n\t,\":doughnut:\"\n\t,\":custard:\"\n\t,\":icecream:\"\n\t,\":ice_cream:\"\n\t,\":shaved_ice:\"\n\t,\":birthday:\"\n\t,\":cake:\"\n\t,\":cookie:\"\n\t,\":chocolate_bar:\"\n\t,\":candy:\"\n\t,\":lollipop:\"\n\t,\":honey_pot:\"\n\t,\":apple:\"\n\t,\":green_apple:\"\n\t,\":tangerine:\"\n\t,\":lemon:\"\n\t,\":cherries:\"\n\t,\":grapes:\"\n\t,\":watermelon:\"\n\t,\":strawberry:\"\n\t,\":peach:\"\n\t,\":melon:\"\n\t,\":banana:\"\n\t,\":pear:\"\n\t,\":pineapple:\"\n\t,\":sweet_potato:\"\n\t,\":eggplant:\"\n\t,\":tomato:\"\n\t,\":corn:\"\n\t,\":house:\"\n\t,\":house_with_garden:\"\n\t,\":school:\"\n\t,\":office:\"\n\t,\":post_office:\"\n\t,\":hospital:\"\n\t,\":bank:\"\n\t,\":convenience_store:\"\n\t,\":love_hotel:\"\n\t,\":hotel:\"\n\t,\":wedding:\"\n\t,\":church:\"\n\t,\":department_store:\"\n\t,\":european_post_office:\"\n\t,\":city_sunrise:\"\n\t,\":city_sunset:\"\n\t,\":japanese_castle:\"\n\t,\":european_castle:\"\n\t,\":tent:\"\n\t,\":factory:\"\n\t,\":tokyo_tower:\"\n\t,\":japan:\"\n\t,\":mount_fuji:\"\n\t,\":sunrise_over_mountains:\"\n\t,\":sunrise:\"\n\t,\":stars:\"\n\t,\":statue_of_liberty:\"\n\t,\":bridge_at_night:\"\n\t,\":carousel_horse:\"\n\t,\":rainbow:\"\n\t,\":ferris_wheel:\"\n\t,\":fountain:\"\n\t,\":roller_coaster:\"\n\t,\":ship:\"\n\t,\":speedboat:\"\n\t,\":boat:\"\n\t,\":sailboat:\"\n\t,\":rowboat:\"\n\t,\":anchor:\"\n\t,\":rocket:\"\n\t,\":airplane:\"\n\t,\":helicopter:\"\n\t,\":steam_locomotive:\"\n\t,\":tram:\"\n\t,\":mountain_railway:\"\n\t,\":bike:\"\n\t,\":aerial_tramway:\"\n\t,\":suspension_railway:\"\n\t,\":mountain_cableway:\"\n\t,\":tractor:\"\n\t,\":blue_car:\"\n\t,\":oncoming_automobile:\"\n\t,\":car:\"\n\t,\":red_car:\"\n\t,\":taxi:\"\n\t,\":oncoming_taxi:\"\n\t,\":articulated_lorry:\"\n\t,\":bus:\"\n\t,\":oncoming_bus:\"\n\t,\":rotating_light:\"\n\t,\":police_car:\"\n\t,\":oncoming_police_car:\"\n\t,\":fire_engine:\"\n\t,\":ambulance:\"\n\t,\":minibus:\"\n\t,\":truck:\"\n\t,\":train:\"\n\t,\":station:\"\n\t,\":train2:\"\n\t,\":bullettrain_front:\"\n\t,\":bullettrain_side:\"\n\t,\":light_rail:\"\n\t,\":monorail:\"\n\t,\":railway_car:\"\n\t,\":trolleybus:\"\n\t,\":ticket:\"\n\t,\":fuelpump:\"\n\t,\":vertical_traffic_light:\"\n\t,\":traffic_light:\"\n\t,\":warning:\"\n\t,\":construction:\"\n\t,\":beginner:\"\n\t,\":atm:\"\n\t,\":slot_machine:\"\n\t,\":busstop:\"\n\t,\":barber:\"\n\t,\":hotsprings:\"\n\t,\":checkered_flag:\"\n\t,\":crossed_flags:\"\n\t,\":izakaya_lantern:\"\n\t,\":moyai:\"\n\t,\":circus_tent:\"\n\t,\":performing_arts:\"\n\t,\":round_pushpin:\"\n\t,\":triangular_flag_on_post:\"\n\t,\":jp:\"\n\t,\":kr:\"\n\t,\":cn:\"\n\t,\":us:\"\n\t,\":fr:\"\n\t,\":es:\"\n\t,\":it:\"\n\t,\":ru:\"\n\t,\":gb:\"\n\t,\":uk:\"\n\t,\":de:\"\n\t,\":one:\"\n\t,\":two:\"\n\t,\":three:\"\n\t,\":four:\"\n\t,\":five:\"\n\t,\":six:\"\n\t,\":seven:\"\n\t,\":eight:\"\n\t,\":nine:\"\n\t,\":keycap_ten:\"\n\t,\":1234:\"\n\t,\":zero:\"\n\t,\":hash:\"\n\t,\":symbols:\"\n\t,\":arrow_backward:\"\n\t,\":arrow_down:\"\n\t,\":arrow_forward:\"\n\t,\":arrow_left:\"\n\t,\":capital_abcd:\"\n\t,\":abcd:\"\n\t,\":abc:\"\n\t,\":arrow_lower_left:\"\n\t,\":arrow_lower_right:\"\n\t,\":arrow_right:\"\n\t,\":arrow_up:\"\n\t,\":arrow_upper_left:\"\n\t,\":arrow_upper_right:\"\n\t,\":arrow_double_down:\"\n\t,\":arrow_double_up:\"\n\t,\":arrow_down_small:\"\n\t,\":arrow_heading_down:\"\n\t,\":arrow_heading_up:\"\n\t,\":leftwards_arrow_with_hook:\"\n\t,\":arrow_right_hook:\"\n\t,\":left_right_arrow:\"\n\t,\":arrow_up_down:\"\n\t,\":arrow_up_small:\"\n\t,\":arrows_clockwise:\"\n\t,\":arrows_counterclockwise:\"\n\t,\":rewind:\"\n\t,\":fast_forward:\"\n\t,\":information_source:\"\n\t,\":ok:\"\n\t,\":twisted_rightwards_arrows:\"\n\t,\":repeat:\"\n\t,\":repeat_one:\"\n\t,\":new:\"\n\t,\":top:\"\n\t,\":up:\"\n\t,\":cool:\"\n\t,\":free:\"\n\t,\":ng:\"\n\t,\":cinema:\"\n\t,\":koko:\"\n\t,\":signal_strength:\"\n\t,\":u5272:\"\n\t,\":u5408:\"\n\t,\":u55b6:\"\n\t,\":u6307:\"\n\t,\":u6708:\"\n\t,\":u6709:\"\n\t,\":u6e80:\"\n\t,\":u7121:\"\n\t,\":u7533:\"\n\t,\":u7a7a:\"\n\t,\":u7981:\"\n\t,\":sa:\"\n\t,\":restroom:\"\n\t,\":mens:\"\n\t,\":womens:\"\n\t,\":baby_symbol:\"\n\t,\":no_smoking:\"\n\t,\":parking:\"\n\t,\":wheelchair:\"\n\t,\":metro:\"\n\t,\":baggage_claim:\"\n\t,\":accept:\"\n\t,\":wc:\"\n\t,\":potable_water:\"\n\t,\":put_litter_in_its_place:\"\n\t,\":secret:\"\n\t,\":congratulations:\"\n\t,\":m:\"\n\t,\":passport_control:\"\n\t,\":left_luggage:\"\n\t,\":customs:\"\n\t,\":ideograph_advantage:\"\n\t,\":cl:\"\n\t,\":sos:\"\n\t,\":id:\"\n\t,\":no_entry_sign:\"\n\t,\":underage:\"\n\t,\":no_mobile_phones:\"\n\t,\":do_not_litter:\"\n\t,\":non-potable_water:\"\n\t,\":no_bicycles:\"\n\t,\":no_pedestrians:\"\n\t,\":children_crossing:\"\n\t,\":no_entry:\"\n\t,\":eight_spoked_asterisk:\"\n\t,\":eight_pointed_black_star:\"\n\t,\":heart_decoration:\"\n\t,\":vs:\"\n\t,\":vibration_mode:\"\n\t,\":mobile_phone_off:\"\n\t,\":chart:\"\n\t,\":currency_exchange:\"\n\t,\":aries:\"\n\t,\":taurus:\"\n\t,\":gemini:\"\n\t,\":cancer:\"\n\t,\":leo:\"\n\t,\":virgo:\"\n\t,\":libra:\"\n\t,\":scorpius:\"\n\t,\":sagittarius:\"\n\t,\":capricorn:\"\n\t,\":aquarius:\"\n\t,\":pisces:\"\n\t,\":ophiuchus:\"\n\t,\":six_pointed_star:\"\n\t,\":negative_squared_cross_mark:\"\n\t,\":a:\"\n\t,\":b:\"\n\t,\":ab:\"\n\t,\":o2:\"\n\t,\":diamond_shape_with_a_dot_inside:\"\n\t,\":recycle:\"\n\t,\":end:\"\n\t,\":on:\"\n\t,\":soon:\"\n\t,\":clock1:\"\n\t,\":clock130:\"\n\t,\":clock10:\"\n\t,\":clock1030:\"\n\t,\":clock11:\"\n\t,\":clock1130:\"\n\t,\":clock12:\"\n\t,\":clock1230:\"\n\t,\":clock2:\"\n\t,\":clock230:\"\n\t,\":clock3:\"\n\t,\":clock330:\"\n\t,\":clock4:\"\n\t,\":clock430:\"\n\t,\":clock5:\"\n\t,\":clock530:\"\n\t,\":clock6:\"\n\t,\":clock630:\"\n\t,\":clock7:\"\n\t,\":clock730:\"\n\t,\":clock8:\"\n\t,\":clock830:\"\n\t,\":clock9:\"\n\t,\":clock930:\"\n\t,\":heavy_dollar_sign:\"\n\t,\":copyright:\"\n\t,\":registered:\"\n\t,\":tm:\"\n\t,\":x:\"\n\t,\":heavy_exclamation_mark:\"\n\t,\":bangbang:\"\n\t,\":interrobang:\"\n\t,\":o:\"\n\t,\":heavy_multiplication_x:\"\n\t,\":heavy_plus_sign:\"\n\t,\":heavy_minus_sign:\"\n\t,\":heavy_division_sign:\"\n\t,\":white_flower:\"\n\t,\":100:\"\n\t,\":heavy_check_mark:\"\n\t,\":ballot_box_with_check:\"\n\t,\":radio_button:\"\n\t,\":link:\"\n\t,\":curly_loop:\"\n\t,\":wavy_dash:\"\n\t,\":part_alternation_mark:\"\n\t,\":trident:\"\n\t,\":black_square:\"\n\t,\":white_square:\"\n\t,\":white_check_mark:\"\n\t,\":black_square_button:\"\n\t,\":white_square_button:\"\n\t,\":black_circle:\"\n\t,\":white_circle:\"\n\t,\":red_circle:\"\n\t,\":large_blue_circle:\"\n\t,\":large_blue_diamond:\"\n\t,\":large_orange_diamond:\"\n\t,\":small_blue_diamond:\"\n\t,\":small_orange_diamond:\"\n\t,\":small_red_triangle:\"\n\t,\":small_red_triangle_down:\"\n\t,\":shipit:\"\n]\n\nfunction emojer () {\n\tindex = Math.floor(Math.random()*emojis.length)\n\treturn emojis[index]\n}\n\nmodule.exports = emojer\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.2.0\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "var emojis = \n  [\":bowtie:\"\n\t,\":smile:\"\n\t,\":laughing:\"\n\t,\":blush:\"\n\t,\":smiley:\"\n\t,\":relaxed:\"\n\t,\":smirk:\"\n\t,\":heart_eyes:\"\n\t,\":kissing_heart:\"\n\t,\":kissing_closed_eyes:\"\n\t,\":flushed:\"\n\t,\":relieved:\"\n\t,\":satisfied:\"\n\t,\":grin:\"\n\t,\":wink:\"\n\t,\":stuck_out_tongue_winking_eye:\"\n\t,\":stuck_out_tongue_closed_eyes:\"\n\t,\":grinning:\"\n\t,\":kissing:\"\n\t,\":kissing_smiling_eyes:\"\n\t,\":stuck_out_tongue:\"\n\t,\":sleeping:\"\n\t,\":worried:\"\n\t,\":frowning:\"\n\t,\":anguished:\"\n\t,\":open_mouth:\"\n\t,\":grimacing:\"\n\t,\":confused:\"\n\t,\":hushed:\"\n\t,\":expressionless:\"\n\t,\":unamused:\"\n\t,\":sweat_smile:\"\n\t,\":sweat:\"\n\t,\":disappointed_relieved:\"\n\t,\":weary:\"\n\t,\":pensive:\"\n\t,\":disappointed:\"\n\t,\":confounded:\"\n\t,\":fearful:\"\n\t,\":cold_sweat:\"\n\t,\":persevere:\"\n\t,\":cry:\"\n\t,\":sob:\"\n\t,\":joy:\"\n\t,\":astonished:\"\n\t,\":scream:\"\n\t,\":neckbeard:\"\n\t,\":tired_face:\"\n\t,\":angry:\"\n\t,\":rage:\"\n\t,\":triumph:\"\n\t,\":sleepy:\"\n\t,\":yum:\"\n\t,\":mask:\"\n\t,\":sunglasses:\"\n\t,\":dizzy_face:\"\n\t,\":imp:\"\n\t,\":smiling_imp:\"\n\t,\":neutral_face:\"\n\t,\":no_mouth:\"\n\t,\":innocent:\"\n\t,\":alien:\"\n\t,\":yellow_heart:\"\n\t,\":blue_heart:\"\n\t,\":purple_heart:\"\n\t,\":heart:\"\n\t,\":green_heart:\"\n\t,\":broken_heart:\"\n\t,\":heartbeat:\"\n\t,\":heartpulse:\"\n\t,\":two_hearts:\"\n\t,\":revolving_hearts:\"\n\t,\":cupid:\"\n\t,\":sparkling_heart:\"\n\t,\":sparkles:\"\n\t,\":star:\"\n\t,\":star2:\"\n\t,\":dizzy:\"\n\t,\":boom:\"\n\t,\":collision:\"\n\t,\":anger:\"\n\t,\":exclamation:\"\n\t,\":question:\"\n\t,\":grey_exclamation:\"\n\t,\":grey_question:\"\n\t,\":zzz:\"\n\t,\":dash:\"\n\t,\":sweat_drops:\"\n\t,\":notes:\"\n\t,\":musical_note:\"\n\t,\":fire:\"\n\t,\":hankey:\"\n\t,\":poop:\"\n\t,\":shit:\"\n\t,\":+1:\"\n\t,\":thumbsup:\"\n\t,\":-1:\"\n\t,\":thumbsdown:\"\n\t,\":ok_hand:\"\n\t,\":punch:\"\n\t,\":facepunch:\"\n\t,\":fist:\"\n\t,\":v:\"\n\t,\":wave:\"\n\t,\":hand:\"\n\t,\":raised_hand:\"\n\t,\":open_hands:\"\n\t,\":point_up:\"\n\t,\":point_down:\"\n\t,\":point_left:\"\n\t,\":point_right:\"\n\t,\":raised_hands:\"\n\t,\":pray:\"\n\t,\":point_up_2:\"\n\t,\":clap:\"\n\t,\":muscle:\"\n\t,\":metal:\"\n\t,\":fu:\"\n\t,\":walking:\"\n\t,\":runner:\"\n\t,\":running:\"\n\t,\":couple:\"\n\t,\":family:\"\n\t,\":two_men_holding_hands:\"\n\t,\":two_women_holding_hands:\"\n\t,\":dancer:\"\n\t,\":dancers:\"\n\t,\":ok_woman:\"\n\t,\":no_good:\"\n\t,\":information_desk_person:\"\n\t,\":raising_hand:\"\n\t,\":bride_with_veil:\"\n\t,\":person_with_pouting_face:\"\n\t,\":person_frowning:\"\n\t,\":bow:\"\n\t,\":couplekiss:\"\n\t,\":couple_with_heart:\"\n\t,\":massage:\"\n\t,\":haircut:\"\n\t,\":nail_care:\"\n\t,\":boy:\"\n\t,\":girl:\"\n\t,\":woman:\"\n\t,\":man:\"\n\t,\":baby:\"\n\t,\":older_woman:\"\n\t,\":older_man:\"\n\t,\":person_with_blond_hair:\"\n\t,\":man_with_gua_pi_mao:\"\n\t,\":man_with_turban:\"\n\t,\":construction_worker:\"\n\t,\":cop:\"\n\t,\":angel:\"\n\t,\":princess:\"\n\t,\":smiley_cat:\"\n\t,\":smile_cat:\"\n\t,\":heart_eyes_cat:\"\n\t,\":kissing_cat:\"\n\t,\":smirk_cat:\"\n\t,\":scream_cat:\"\n\t,\":crying_cat_face:\"\n\t,\":joy_cat:\"\n\t,\":pouting_cat:\"\n\t,\":japanese_ogre:\"\n\t,\":japanese_goblin:\"\n\t,\":see_no_evil:\"\n\t,\":hear_no_evil:\"\n\t,\":speak_no_evil:\"\n\t,\":guardsman:\"\n\t,\":skull:\"\n\t,\":feet:\"\n\t,\":lips:\"\n\t,\":kiss:\"\n\t,\":droplet:\"\n\t,\":ear:\"\n\t,\":eyes:\"\n\t,\":nose:\"\n\t,\":tongue:\"\n\t,\":love_letter:\"\n\t,\":bust_in_silhouette:\"\n\t,\":busts_in_silhouette:\"\n\t,\":speech_balloon:\"\n\t,\":thought_balloon:\"\n\t,\":feelsgood:\"\n\t,\":finnadie:\"\n\t,\":goberserk:\"\n\t,\":godmode:\"\n\t,\":hurtrealbad:\"\n\t,\":rage1:\"\n\t,\":rage2:\"\n\t,\":rage3:\"\n\t,\":rage4:\"\n\t,\":suspect:\"\n\t,\":trollface:\"\n\t,\":sunny:\"\n\t,\":umbrella:\"\n\t,\":cloud:\"\n\t,\":snowflake:\"\n\t,\":snowman:\"\n\t,\":zap:\"\n\t,\":cyclone:\"\n\t,\":foggy:\"\n\t,\":ocean:\"\n\t,\":cat:\"\n\t,\":dog:\"\n\t,\":mouse:\"\n\t,\":hamster:\"\n\t,\":rabbit:\"\n\t,\":wolf:\"\n\t,\":frog:\"\n\t,\":tiger:\"\n\t,\":koala:\"\n\t,\":bear:\"\n\t,\":pig:\"\n\t,\":pig_nose:\"\n\t,\":cow:\"\n\t,\":boar:\"\n\t,\":monkey_face:\"\n\t,\":monkey:\"\n\t,\":horse:\"\n\t,\":racehorse:\"\n\t,\":camel:\"\n\t,\":sheep:\"\n\t,\":elephant:\"\n\t,\":panda_face:\"\n\t,\":snake:\"\n\t,\":bird:\"\n\t,\":baby_chick:\"\n\t,\":hatched_chick:\"\n\t,\":hatching_chick:\"\n\t,\":chicken:\"\n\t,\":penguin:\"\n\t,\":turtle:\"\n\t,\":bug:\"\n\t,\":honeybee:\"\n\t,\":ant:\"\n\t,\":beetle:\"\n\t,\":snail:\"\n\t,\":octopus:\"\n\t,\":tropical_fish:\"\n\t,\":fish:\"\n\t,\":whale:\"\n\t,\":whale2:\"\n\t,\":dolphin:\"\n\t,\":cow2:\"\n\t,\":ram:\"\n\t,\":rat:\"\n\t,\":water_buffalo:\"\n\t,\":tiger2:\"\n\t,\":rabbit2:\"\n\t,\":dragon:\"\n\t,\":goat:\"\n\t,\":rooster:\"\n\t,\":dog2:\"\n\t,\":pig2:\"\n\t,\":mouse2:\"\n\t,\":ox:\"\n\t,\":dragon_face:\"\n\t,\":blowfish:\"\n\t,\":crocodile:\"\n\t,\":dromedary_camel:\"\n\t,\":leopard:\"\n\t,\":cat2:\"\n\t,\":poodle:\"\n\t,\":paw_prints:\"\n\t,\":bouquet:\"\n\t,\":cherry_blossom:\"\n\t,\":tulip:\"\n\t,\":four_leaf_clover:\"\n\t,\":rose:\"\n\t,\":sunflower:\"\n\t,\":hibiscus:\"\n\t,\":maple_leaf:\"\n\t,\":leaves:\"\n\t,\":fallen_leaf:\"\n\t,\":herb:\"\n\t,\":mushroom:\"\n\t,\":cactus:\"\n\t,\":palm_tree:\"\n\t,\":evergreen_tree:\"\n\t,\":deciduous_tree:\"\n\t,\":chestnut:\"\n\t,\":seedling:\"\n\t,\":blossom:\"\n\t,\":ear_of_rice:\"\n\t,\":shell:\"\n\t,\":globe_with_meridians:\"\n\t,\":sun_with_face:\"\n\t,\":full_moon_with_face:\"\n\t,\":new_moon_with_face:\"\n\t,\":new_moon:\"\n\t,\":waxing_crescent_moon:\"\n\t,\":first_quarter_moon:\"\n\t,\":waxing_gibbous_moon:\"\n\t,\":full_moon:\"\n\t,\":waning_gibbous_moon:\"\n\t,\":last_quarter_moon:\"\n\t,\":waning_crescent_moon:\"\n\t,\":last_quarter_moon_with_face:\"\n\t,\":first_quarter_moon_with_face:\"\n\t,\":moon:\"\n\t,\":earth_africa:\"\n\t,\":earth_americas:\"\n\t,\":earth_asia:\"\n\t,\":volcano:\"\n\t,\":milky_way:\"\n\t,\":partly_sunny:\"\n\t,\":octocat:\"\n\t,\":squirrel:\"\n\t,\":bamboo:\"\n\t,\":gift_heart:\"\n\t,\":dolls:\"\n\t,\":school_satchel:\"\n\t,\":mortar_board:\"\n\t,\":flags:\"\n\t,\":fireworks:\"\n\t,\":sparkler:\"\n\t,\":wind_chime:\"\n\t,\":rice_scene:\"\n\t,\":jack_o_lantern:\"\n\t,\":ghost:\"\n\t,\":santa:\"\n\t,\":christmas_tree:\"\n\t,\":gift:\"\n\t,\":bell:\"\n\t,\":no_bell:\"\n\t,\":tanabata_tree:\"\n\t,\":tada:\"\n\t,\":confetti_ball:\"\n\t,\":balloon:\"\n\t,\":crystal_ball:\"\n\t,\":cd:\"\n\t,\":dvd:\"\n\t,\":floppy_disk:\"\n\t,\":camera:\"\n\t,\":video_camera:\"\n\t,\":movie_camera:\"\n\t,\":computer:\"\n\t,\":tv:\"\n\t,\":iphone:\"\n\t,\":phone:\"\n\t,\":telephone:\"\n\t,\":telephone_receiver:\"\n\t,\":pager:\"\n\t,\":fax:\"\n\t,\":minidisc:\"\n\t,\":vhs:\"\n\t,\":sound:\"\n\t,\":speaker:\"\n\t,\":mute:\"\n\t,\":loudspeaker:\"\n\t,\":mega:\"\n\t,\":hourglass:\"\n\t,\":hourglass_flowing_sand:\"\n\t,\":alarm_clock:\"\n\t,\":watch:\"\n\t,\":radio:\"\n\t,\":satellite:\"\n\t,\":loop:\"\n\t,\":mag:\"\n\t,\":mag_right:\"\n\t,\":unlock:\"\n\t,\":lock:\"\n\t,\":lock_with_ink_pen:\"\n\t,\":closed_lock_with_key:\"\n\t,\":key:\"\n\t,\":bulb:\"\n\t,\":flashlight:\"\n\t,\":high_brightness:\"\n\t,\":low_brightness:\"\n\t,\":electric_plug:\"\n\t,\":battery:\"\n\t,\":calling:\"\n\t,\":email:\"\n\t,\":mailbox:\"\n\t,\":postbox:\"\n\t,\":bath:\"\n\t,\":bathtub:\"\n\t,\":shower:\"\n\t,\":toilet:\"\n\t,\":wrench:\"\n\t,\":nut_and_bolt:\"\n\t,\":hammer:\"\n\t,\":seat:\"\n\t,\":moneybag:\"\n\t,\":yen:\"\n\t,\":dollar:\"\n\t,\":pound:\"\n\t,\":euro:\"\n\t,\":credit_card:\"\n\t,\":money_with_wings:\"\n\t,\":e-mail:\"\n\t,\":inbox_tray:\"\n\t,\":outbox_tray:\"\n\t,\":envelope:\"\n\t,\":incoming_envelope:\"\n\t,\":postal_horn:\"\n\t,\":mailbox_closed:\"\n\t,\":mailbox_with_mail:\"\n\t,\":mailbox_with_no_mail:\"\n\t,\":door:\"\n\t,\":smoking:\"\n\t,\":bomb:\"\n\t,\":gun:\"\n\t,\":hocho:\"\n\t,\":pill:\"\n\t,\":syringe:\"\n\t,\":page_facing_up:\"\n\t,\":page_with_curl:\"\n\t,\":bookmark_tabs:\"\n\t,\":bar_chart:\"\n\t,\":chart_with_upwards_trend:\"\n\t,\":chart_with_downwards_trend:\"\n\t,\":scroll:\"\n\t,\":clipboard:\"\n\t,\":calendar:\"\n\t,\":date:\"\n\t,\":card_index:\"\n\t,\":file_folder:\"\n\t,\":open_file_folder:\"\n\t,\":scissors:\"\n\t,\":pushpin:\"\n\t,\":paperclip:\"\n\t,\":black_nib:\"\n\t,\":pencil2:\"\n\t,\":straight_ruler:\"\n\t,\":triangular_ruler:\"\n\t,\":closed_book:\"\n\t,\":green_book:\"\n\t,\":blue_book:\"\n\t,\":orange_book:\"\n\t,\":notebook:\"\n\t,\":notebook_with_decorative_cover:\"\n\t,\":ledger:\"\n\t,\":books:\"\n\t,\":bookmark:\"\n\t,\":name_badge:\"\n\t,\":microscope:\"\n\t,\":telescope:\"\n\t,\":newspaper:\"\n\t,\":football:\"\n\t,\":basketball:\"\n\t,\":soccer:\"\n\t,\":baseball:\"\n\t,\":tennis:\"\n\t,\":8ball:\"\n\t,\":rugby_football:\"\n\t,\":bowling:\"\n\t,\":golf:\"\n\t,\":mountain_bicyclist:\"\n\t,\":bicyclist:\"\n\t,\":horse_racing:\"\n\t,\":snowboarder:\"\n\t,\":swimmer:\"\n\t,\":surfer:\"\n\t,\":ski:\"\n\t,\":spades:\"\n\t,\":hearts:\"\n\t,\":clubs:\"\n\t,\":diamonds:\"\n\t,\":gem:\"\n\t,\":ring:\"\n\t,\":trophy:\"\n\t,\":musical_score:\"\n\t,\":musical_keyboard:\"\n\t,\":violin:\"\n\t,\":space_invader:\"\n\t,\":video_game:\"\n\t,\":black_joker:\"\n\t,\":flower_playing_cards:\"\n\t,\":game_die:\"\n\t,\":dart:\"\n\t,\":mahjong:\"\n\t,\":clapper:\"\n\t,\":memo:\"\n\t,\":pencil:\"\n\t,\":book:\"\n\t,\":art:\"\n\t,\":microphone:\"\n\t,\":headphones:\"\n\t,\":trumpet:\"\n\t,\":saxophone:\"\n\t,\":guitar:\"\n\t,\":shoe:\"\n\t,\":sandal:\"\n\t,\":high_heel:\"\n\t,\":lipstick:\"\n\t,\":boot:\"\n\t,\":shirt:\"\n\t,\":tshirt:\"\n\t,\":necktie:\"\n\t,\":womans_clothes:\"\n\t,\":dress:\"\n\t,\":running_shirt_with_sash:\"\n\t,\":jeans:\"\n\t,\":kimono:\"\n\t,\":bikini:\"\n\t,\":ribbon:\"\n\t,\":tophat:\"\n\t,\":crown:\"\n\t,\":womans_hat:\"\n\t,\":mans_shoe:\"\n\t,\":closed_umbrella:\"\n\t,\":briefcase:\"\n\t,\":handbag:\"\n\t,\":pouch:\"\n\t,\":purse:\"\n\t,\":eyeglasses:\"\n\t,\":fishing_pole_and_fish:\"\n\t,\":coffee:\"\n\t,\":tea:\"\n\t,\":sake:\"\n\t,\":baby_bottle:\"\n\t,\":beer:\"\n\t,\":beers:\"\n\t,\":cocktail:\"\n\t,\":tropical_drink:\"\n\t,\":wine_glass:\"\n\t,\":fork_and_knife:\"\n\t,\":pizza:\"\n\t,\":hamburger:\"\n\t,\":fries:\"\n\t,\":poultry_leg:\"\n\t,\":meat_on_bone:\"\n\t,\":spaghetti:\"\n\t,\":curry:\"\n\t,\":fried_shrimp:\"\n\t,\":bento:\"\n\t,\":sushi:\"\n\t,\":fish_cake:\"\n\t,\":rice_ball:\"\n\t,\":rice_cracker:\"\n\t,\":rice:\"\n\t,\":ramen:\"\n\t,\":stew:\"\n\t,\":oden:\"\n\t,\":dango:\"\n\t,\":egg:\"\n\t,\":bread:\"\n\t,\":doughnut:\"\n\t,\":custard:\"\n\t,\":icecream:\"\n\t,\":ice_cream:\"\n\t,\":shaved_ice:\"\n\t,\":birthday:\"\n\t,\":cake:\"\n\t,\":cookie:\"\n\t,\":chocolate_bar:\"\n\t,\":candy:\"\n\t,\":lollipop:\"\n\t,\":honey_pot:\"\n\t,\":apple:\"\n\t,\":green_apple:\"\n\t,\":tangerine:\"\n\t,\":lemon:\"\n\t,\":cherries:\"\n\t,\":grapes:\"\n\t,\":watermelon:\"\n\t,\":strawberry:\"\n\t,\":peach:\"\n\t,\":melon:\"\n\t,\":banana:\"\n\t,\":pear:\"\n\t,\":pineapple:\"\n\t,\":sweet_potato:\"\n\t,\":eggplant:\"\n\t,\":tomato:\"\n\t,\":corn:\"\n\t,\":house:\"\n\t,\":house_with_garden:\"\n\t,\":school:\"\n\t,\":office:\"\n\t,\":post_office:\"\n\t,\":hospital:\"\n\t,\":bank:\"\n\t,\":convenience_store:\"\n\t,\":love_hotel:\"\n\t,\":hotel:\"\n\t,\":wedding:\"\n\t,\":church:\"\n\t,\":department_store:\"\n\t,\":european_post_office:\"\n\t,\":city_sunrise:\"\n\t,\":city_sunset:\"\n\t,\":japanese_castle:\"\n\t,\":european_castle:\"\n\t,\":tent:\"\n\t,\":factory:\"\n\t,\":tokyo_tower:\"\n\t,\":japan:\"\n\t,\":mount_fuji:\"\n\t,\":sunrise_over_mountains:\"\n\t,\":sunrise:\"\n\t,\":stars:\"\n\t,\":statue_of_liberty:\"\n\t,\":bridge_at_night:\"\n\t,\":carousel_horse:\"\n\t,\":rainbow:\"\n\t,\":ferris_wheel:\"\n\t,\":fountain:\"\n\t,\":roller_coaster:\"\n\t,\":ship:\"\n\t,\":speedboat:\"\n\t,\":boat:\"\n\t,\":sailboat:\"\n\t,\":rowboat:\"\n\t,\":anchor:\"\n\t,\":rocket:\"\n\t,\":airplane:\"\n\t,\":helicopter:\"\n\t,\":steam_locomotive:\"\n\t,\":tram:\"\n\t,\":mountain_railway:\"\n\t,\":bike:\"\n\t,\":aerial_tramway:\"\n\t,\":suspension_railway:\"\n\t,\":mountain_cableway:\"\n\t,\":tractor:\"\n\t,\":blue_car:\"\n\t,\":oncoming_automobile:\"\n\t,\":car:\"\n\t,\":red_car:\"\n\t,\":taxi:\"\n\t,\":oncoming_taxi:\"\n\t,\":articulated_lorry:\"\n\t,\":bus:\"\n\t,\":oncoming_bus:\"\n\t,\":rotating_light:\"\n\t,\":police_car:\"\n\t,\":oncoming_police_car:\"\n\t,\":fire_engine:\"\n\t,\":ambulance:\"\n\t,\":minibus:\"\n\t,\":truck:\"\n\t,\":train:\"\n\t,\":station:\"\n\t,\":train2:\"\n\t,\":bullettrain_front:\"\n\t,\":bullettrain_side:\"\n\t,\":light_rail:\"\n\t,\":monorail:\"\n\t,\":railway_car:\"\n\t,\":trolleybus:\"\n\t,\":ticket:\"\n\t,\":fuelpump:\"\n\t,\":vertical_traffic_light:\"\n\t,\":traffic_light:\"\n\t,\":warning:\"\n\t,\":construction:\"\n\t,\":beginner:\"\n\t,\":atm:\"\n\t,\":slot_machine:\"\n\t,\":busstop:\"\n\t,\":barber:\"\n\t,\":hotsprings:\"\n\t,\":checkered_flag:\"\n\t,\":crossed_flags:\"\n\t,\":izakaya_lantern:\"\n\t,\":moyai:\"\n\t,\":circus_tent:\"\n\t,\":performing_arts:\"\n\t,\":round_pushpin:\"\n\t,\":triangular_flag_on_post:\"\n\t,\":jp:\"\n\t,\":kr:\"\n\t,\":cn:\"\n\t,\":us:\"\n\t,\":fr:\"\n\t,\":es:\"\n\t,\":it:\"\n\t,\":ru:\"\n\t,\":gb:\"\n\t,\":uk:\"\n\t,\":de:\"\n\t,\":one:\"\n\t,\":two:\"\n\t,\":three:\"\n\t,\":four:\"\n\t,\":five:\"\n\t,\":six:\"\n\t,\":seven:\"\n\t,\":eight:\"\n\t,\":nine:\"\n\t,\":keycap_ten:\"\n\t,\":1234:\"\n\t,\":zero:\"\n\t,\":hash:\"\n\t,\":symbols:\"\n\t,\":arrow_backward:\"\n\t,\":arrow_down:\"\n\t,\":arrow_forward:\"\n\t,\":arrow_left:\"\n\t,\":capital_abcd:\"\n\t,\":abcd:\"\n\t,\":abc:\"\n\t,\":arrow_lower_left:\"\n\t,\":arrow_lower_right:\"\n\t,\":arrow_right:\"\n\t,\":arrow_up:\"\n\t,\":arrow_upper_left:\"\n\t,\":arrow_upper_right:\"\n\t,\":arrow_double_down:\"\n\t,\":arrow_double_up:\"\n\t,\":arrow_down_small:\"\n\t,\":arrow_heading_down:\"\n\t,\":arrow_heading_up:\"\n\t,\":leftwards_arrow_with_hook:\"\n\t,\":arrow_right_hook:\"\n\t,\":left_right_arrow:\"\n\t,\":arrow_up_down:\"\n\t,\":arrow_up_small:\"\n\t,\":arrows_clockwise:\"\n\t,\":arrows_counterclockwise:\"\n\t,\":rewind:\"\n\t,\":fast_forward:\"\n\t,\":information_source:\"\n\t,\":ok:\"\n\t,\":twisted_rightwards_arrows:\"\n\t,\":repeat:\"\n\t,\":repeat_one:\"\n\t,\":new:\"\n\t,\":top:\"\n\t,\":up:\"\n\t,\":cool:\"\n\t,\":free:\"\n\t,\":ng:\"\n\t,\":cinema:\"\n\t,\":koko:\"\n\t,\":signal_strength:\"\n\t,\":u5272:\"\n\t,\":u5408:\"\n\t,\":u55b6:\"\n\t,\":u6307:\"\n\t,\":u6708:\"\n\t,\":u6709:\"\n\t,\":u6e80:\"\n\t,\":u7121:\"\n\t,\":u7533:\"\n\t,\":u7a7a:\"\n\t,\":u7981:\"\n\t,\":sa:\"\n\t,\":restroom:\"\n\t,\":mens:\"\n\t,\":womens:\"\n\t,\":baby_symbol:\"\n\t,\":no_smoking:\"\n\t,\":parking:\"\n\t,\":wheelchair:\"\n\t,\":metro:\"\n\t,\":baggage_claim:\"\n\t,\":accept:\"\n\t,\":wc:\"\n\t,\":potable_water:\"\n\t,\":put_litter_in_its_place:\"\n\t,\":secret:\"\n\t,\":congratulations:\"\n\t,\":m:\"\n\t,\":passport_control:\"\n\t,\":left_luggage:\"\n\t,\":customs:\"\n\t,\":ideograph_advantage:\"\n\t,\":cl:\"\n\t,\":sos:\"\n\t,\":id:\"\n\t,\":no_entry_sign:\"\n\t,\":underage:\"\n\t,\":no_mobile_phones:\"\n\t,\":do_not_litter:\"\n\t,\":non-potable_water:\"\n\t,\":no_bicycles:\"\n\t,\":no_pedestrians:\"\n\t,\":children_crossing:\"\n\t,\":no_entry:\"\n\t,\":eight_spoked_asterisk:\"\n\t,\":eight_pointed_black_star:\"\n\t,\":heart_decoration:\"\n\t,\":vs:\"\n\t,\":vibration_mode:\"\n\t,\":mobile_phone_off:\"\n\t,\":chart:\"\n\t,\":currency_exchange:\"\n\t,\":aries:\"\n\t,\":taurus:\"\n\t,\":gemini:\"\n\t,\":cancer:\"\n\t,\":leo:\"\n\t,\":virgo:\"\n\t,\":libra:\"\n\t,\":scorpius:\"\n\t,\":sagittarius:\"\n\t,\":capricorn:\"\n\t,\":aquarius:\"\n\t,\":pisces:\"\n\t,\":ophiuchus:\"\n\t,\":six_pointed_star:\"\n\t,\":negative_squared_cross_mark:\"\n\t,\":a:\"\n\t,\":b:\"\n\t,\":ab:\"\n\t,\":o2:\"\n\t,\":diamond_shape_with_a_dot_inside:\"\n\t,\":recycle:\"\n\t,\":end:\"\n\t,\":on:\"\n\t,\":soon:\"\n\t,\":clock1:\"\n\t,\":clock130:\"\n\t,\":clock10:\"\n\t,\":clock1030:\"\n\t,\":clock11:\"\n\t,\":clock1130:\"\n\t,\":clock12:\"\n\t,\":clock1230:\"\n\t,\":clock2:\"\n\t,\":clock230:\"\n\t,\":clock3:\"\n\t,\":clock330:\"\n\t,\":clock4:\"\n\t,\":clock430:\"\n\t,\":clock5:\"\n\t,\":clock530:\"\n\t,\":clock6:\"\n\t,\":clock630:\"\n\t,\":clock7:\"\n\t,\":clock730:\"\n\t,\":clock8:\"\n\t,\":clock830:\"\n\t,\":clock9:\"\n\t,\":clock930:\"\n\t,\":heavy_dollar_sign:\"\n\t,\":copyright:\"\n\t,\":registered:\"\n\t,\":tm:\"\n\t,\":x:\"\n\t,\":heavy_exclamation_mark:\"\n\t,\":bangbang:\"\n\t,\":interrobang:\"\n\t,\":o:\"\n\t,\":heavy_multiplication_x:\"\n\t,\":heavy_plus_sign:\"\n\t,\":heavy_minus_sign:\"\n\t,\":heavy_division_sign:\"\n\t,\":white_flower:\"\n\t,\":100:\"\n\t,\":heavy_check_mark:\"\n\t,\":ballot_box_with_check:\"\n\t,\":radio_button:\"\n\t,\":link:\"\n\t,\":curly_loop:\"\n\t,\":wavy_dash:\"\n\t,\":part_alternation_mark:\"\n\t,\":trident:\"\n\t,\":black_square:\"\n\t,\":white_square:\"\n\t,\":white_check_mark:\"\n\t,\":black_square_button:\"\n\t,\":white_square_button:\"\n\t,\":black_circle:\"\n\t,\":white_circle:\"\n\t,\":red_circle:\"\n\t,\":large_blue_circle:\"\n\t,\":large_blue_diamond:\"\n\t,\":large_orange_diamond:\"\n\t,\":small_blue_diamond:\"\n\t,\":small_orange_diamond:\"\n\t,\":small_red_triangle:\"\n\t,\":small_red_triangle_down:\"\n\t,\":shipit:\"\n]\n\nfunction emojer () {\n\tindex = Math.floor(Math.random()*emojis.length)\n\treturn emojis[index]\n}\n\nmodule.exports = emojer\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.2.0\"};",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.2.0",
      "entryPoint": "main",
      "repository": {
        "id": 12983847,
        "name": "emojer",
        "full_name": "STRd6/emojer",
        "owner": {
          "login": "STRd6",
          "id": 18894,
          "avatar_url": "https://0.gravatar.com/avatar/33117162fff8a9cf50544a604f60c045?d=https%3A%2F%2Fidenticons.github.com%2F39df222bffe39629d904e4883eabc654.png&r=x",
          "gravatar_id": "33117162fff8a9cf50544a604f60c045",
          "url": "https://api.github.com/users/STRd6",
          "html_url": "https://github.com/STRd6",
          "followers_url": "https://api.github.com/users/STRd6/followers",
          "following_url": "https://api.github.com/users/STRd6/following{/other_user}",
          "gists_url": "https://api.github.com/users/STRd6/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/STRd6/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/STRd6/subscriptions",
          "organizations_url": "https://api.github.com/users/STRd6/orgs",
          "repos_url": "https://api.github.com/users/STRd6/repos",
          "events_url": "https://api.github.com/users/STRd6/events{/privacy}",
          "received_events_url": "https://api.github.com/users/STRd6/received_events",
          "type": "User",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/STRd6/emojer",
        "description": "Randomly returns a Github emoji",
        "fork": true,
        "url": "https://api.github.com/repos/STRd6/emojer",
        "forks_url": "https://api.github.com/repos/STRd6/emojer/forks",
        "keys_url": "https://api.github.com/repos/STRd6/emojer/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/STRd6/emojer/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/STRd6/emojer/teams",
        "hooks_url": "https://api.github.com/repos/STRd6/emojer/hooks",
        "issue_events_url": "https://api.github.com/repos/STRd6/emojer/issues/events{/number}",
        "events_url": "https://api.github.com/repos/STRd6/emojer/events",
        "assignees_url": "https://api.github.com/repos/STRd6/emojer/assignees{/user}",
        "branches_url": "https://api.github.com/repos/STRd6/emojer/branches{/branch}",
        "tags_url": "https://api.github.com/repos/STRd6/emojer/tags",
        "blobs_url": "https://api.github.com/repos/STRd6/emojer/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/STRd6/emojer/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/STRd6/emojer/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/STRd6/emojer/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/STRd6/emojer/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/STRd6/emojer/languages",
        "stargazers_url": "https://api.github.com/repos/STRd6/emojer/stargazers",
        "contributors_url": "https://api.github.com/repos/STRd6/emojer/contributors",
        "subscribers_url": "https://api.github.com/repos/STRd6/emojer/subscribers",
        "subscription_url": "https://api.github.com/repos/STRd6/emojer/subscription",
        "commits_url": "https://api.github.com/repos/STRd6/emojer/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/STRd6/emojer/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/STRd6/emojer/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/STRd6/emojer/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/STRd6/emojer/contents/{+path}",
        "compare_url": "https://api.github.com/repos/STRd6/emojer/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/STRd6/emojer/merges",
        "archive_url": "https://api.github.com/repos/STRd6/emojer/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/STRd6/emojer/downloads",
        "issues_url": "https://api.github.com/repos/STRd6/emojer/issues{/number}",
        "pulls_url": "https://api.github.com/repos/STRd6/emojer/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/STRd6/emojer/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/STRd6/emojer/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/STRd6/emojer/labels{/name}",
        "releases_url": "https://api.github.com/repos/STRd6/emojer/releases{/id}",
        "created_at": "2013-09-20T21:06:32Z",
        "updated_at": "2013-09-20T21:09:44Z",
        "pushed_at": "2013-09-20T21:09:43Z",
        "git_url": "git://github.com/STRd6/emojer.git",
        "ssh_url": "git@github.com:STRd6/emojer.git",
        "clone_url": "https://github.com/STRd6/emojer.git",
        "svn_url": "https://github.com/STRd6/emojer",
        "homepage": null,
        "size": 175,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "JavaScript",
        "has_issues": false,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "parent": {
          "id": 12936780,
          "name": "emojer",
          "full_name": "CanastaNasty/emojer",
          "owner": {
            "login": "CanastaNasty",
            "id": 1432520,
            "avatar_url": "https://2.gravatar.com/avatar/0568dac9cff14cb947d2094a92e08f97?d=https%3A%2F%2Fidenticons.github.com%2Fc171966c9f88c386124ebd4c23604f44.png&r=x",
            "gravatar_id": "0568dac9cff14cb947d2094a92e08f97",
            "url": "https://api.github.com/users/CanastaNasty",
            "html_url": "https://github.com/CanastaNasty",
            "followers_url": "https://api.github.com/users/CanastaNasty/followers",
            "following_url": "https://api.github.com/users/CanastaNasty/following{/other_user}",
            "gists_url": "https://api.github.com/users/CanastaNasty/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/CanastaNasty/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/CanastaNasty/subscriptions",
            "organizations_url": "https://api.github.com/users/CanastaNasty/orgs",
            "repos_url": "https://api.github.com/users/CanastaNasty/repos",
            "events_url": "https://api.github.com/users/CanastaNasty/events{/privacy}",
            "received_events_url": "https://api.github.com/users/CanastaNasty/received_events",
            "type": "User",
            "site_admin": false
          },
          "private": false,
          "html_url": "https://github.com/CanastaNasty/emojer",
          "description": "Randomly returns a Github emoji",
          "fork": false,
          "url": "https://api.github.com/repos/CanastaNasty/emojer",
          "forks_url": "https://api.github.com/repos/CanastaNasty/emojer/forks",
          "keys_url": "https://api.github.com/repos/CanastaNasty/emojer/keys{/key_id}",
          "collaborators_url": "https://api.github.com/repos/CanastaNasty/emojer/collaborators{/collaborator}",
          "teams_url": "https://api.github.com/repos/CanastaNasty/emojer/teams",
          "hooks_url": "https://api.github.com/repos/CanastaNasty/emojer/hooks",
          "issue_events_url": "https://api.github.com/repos/CanastaNasty/emojer/issues/events{/number}",
          "events_url": "https://api.github.com/repos/CanastaNasty/emojer/events",
          "assignees_url": "https://api.github.com/repos/CanastaNasty/emojer/assignees{/user}",
          "branches_url": "https://api.github.com/repos/CanastaNasty/emojer/branches{/branch}",
          "tags_url": "https://api.github.com/repos/CanastaNasty/emojer/tags",
          "blobs_url": "https://api.github.com/repos/CanastaNasty/emojer/git/blobs{/sha}",
          "git_tags_url": "https://api.github.com/repos/CanastaNasty/emojer/git/tags{/sha}",
          "git_refs_url": "https://api.github.com/repos/CanastaNasty/emojer/git/refs{/sha}",
          "trees_url": "https://api.github.com/repos/CanastaNasty/emojer/git/trees{/sha}",
          "statuses_url": "https://api.github.com/repos/CanastaNasty/emojer/statuses/{sha}",
          "languages_url": "https://api.github.com/repos/CanastaNasty/emojer/languages",
          "stargazers_url": "https://api.github.com/repos/CanastaNasty/emojer/stargazers",
          "contributors_url": "https://api.github.com/repos/CanastaNasty/emojer/contributors",
          "subscribers_url": "https://api.github.com/repos/CanastaNasty/emojer/subscribers",
          "subscription_url": "https://api.github.com/repos/CanastaNasty/emojer/subscription",
          "commits_url": "https://api.github.com/repos/CanastaNasty/emojer/commits{/sha}",
          "git_commits_url": "https://api.github.com/repos/CanastaNasty/emojer/git/commits{/sha}",
          "comments_url": "https://api.github.com/repos/CanastaNasty/emojer/comments{/number}",
          "issue_comment_url": "https://api.github.com/repos/CanastaNasty/emojer/issues/comments/{number}",
          "contents_url": "https://api.github.com/repos/CanastaNasty/emojer/contents/{+path}",
          "compare_url": "https://api.github.com/repos/CanastaNasty/emojer/compare/{base}...{head}",
          "merges_url": "https://api.github.com/repos/CanastaNasty/emojer/merges",
          "archive_url": "https://api.github.com/repos/CanastaNasty/emojer/{archive_format}{/ref}",
          "downloads_url": "https://api.github.com/repos/CanastaNasty/emojer/downloads",
          "issues_url": "https://api.github.com/repos/CanastaNasty/emojer/issues{/number}",
          "pulls_url": "https://api.github.com/repos/CanastaNasty/emojer/pulls{/number}",
          "milestones_url": "https://api.github.com/repos/CanastaNasty/emojer/milestones{/number}",
          "notifications_url": "https://api.github.com/repos/CanastaNasty/emojer/notifications{?since,all,participating}",
          "labels_url": "https://api.github.com/repos/CanastaNasty/emojer/labels{/name}",
          "releases_url": "https://api.github.com/repos/CanastaNasty/emojer/releases{/id}",
          "created_at": "2013-09-18T23:17:00Z",
          "updated_at": "2013-09-20T21:06:32Z",
          "pushed_at": "2013-09-19T00:22:07Z",
          "git_url": "git://github.com/CanastaNasty/emojer.git",
          "ssh_url": "git@github.com:CanastaNasty/emojer.git",
          "clone_url": "https://github.com/CanastaNasty/emojer.git",
          "svn_url": "https://github.com/CanastaNasty/emojer",
          "homepage": null,
          "size": 252,
          "stargazers_count": 0,
          "watchers_count": 0,
          "language": "JavaScript",
          "has_issues": true,
          "has_downloads": true,
          "has_wiki": true,
          "forks_count": 1,
          "mirror_url": null,
          "open_issues_count": 0,
          "forks": 1,
          "open_issues": 0,
          "watchers": 0,
          "default_branch": "master",
          "master_branch": "master"
        },
        "source": {
          "id": 12936780,
          "name": "emojer",
          "full_name": "CanastaNasty/emojer",
          "owner": {
            "login": "CanastaNasty",
            "id": 1432520,
            "avatar_url": "https://2.gravatar.com/avatar/0568dac9cff14cb947d2094a92e08f97?d=https%3A%2F%2Fidenticons.github.com%2Fc171966c9f88c386124ebd4c23604f44.png&r=x",
            "gravatar_id": "0568dac9cff14cb947d2094a92e08f97",
            "url": "https://api.github.com/users/CanastaNasty",
            "html_url": "https://github.com/CanastaNasty",
            "followers_url": "https://api.github.com/users/CanastaNasty/followers",
            "following_url": "https://api.github.com/users/CanastaNasty/following{/other_user}",
            "gists_url": "https://api.github.com/users/CanastaNasty/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/CanastaNasty/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/CanastaNasty/subscriptions",
            "organizations_url": "https://api.github.com/users/CanastaNasty/orgs",
            "repos_url": "https://api.github.com/users/CanastaNasty/repos",
            "events_url": "https://api.github.com/users/CanastaNasty/events{/privacy}",
            "received_events_url": "https://api.github.com/users/CanastaNasty/received_events",
            "type": "User",
            "site_admin": false
          },
          "private": false,
          "html_url": "https://github.com/CanastaNasty/emojer",
          "description": "Randomly returns a Github emoji",
          "fork": false,
          "url": "https://api.github.com/repos/CanastaNasty/emojer",
          "forks_url": "https://api.github.com/repos/CanastaNasty/emojer/forks",
          "keys_url": "https://api.github.com/repos/CanastaNasty/emojer/keys{/key_id}",
          "collaborators_url": "https://api.github.com/repos/CanastaNasty/emojer/collaborators{/collaborator}",
          "teams_url": "https://api.github.com/repos/CanastaNasty/emojer/teams",
          "hooks_url": "https://api.github.com/repos/CanastaNasty/emojer/hooks",
          "issue_events_url": "https://api.github.com/repos/CanastaNasty/emojer/issues/events{/number}",
          "events_url": "https://api.github.com/repos/CanastaNasty/emojer/events",
          "assignees_url": "https://api.github.com/repos/CanastaNasty/emojer/assignees{/user}",
          "branches_url": "https://api.github.com/repos/CanastaNasty/emojer/branches{/branch}",
          "tags_url": "https://api.github.com/repos/CanastaNasty/emojer/tags",
          "blobs_url": "https://api.github.com/repos/CanastaNasty/emojer/git/blobs{/sha}",
          "git_tags_url": "https://api.github.com/repos/CanastaNasty/emojer/git/tags{/sha}",
          "git_refs_url": "https://api.github.com/repos/CanastaNasty/emojer/git/refs{/sha}",
          "trees_url": "https://api.github.com/repos/CanastaNasty/emojer/git/trees{/sha}",
          "statuses_url": "https://api.github.com/repos/CanastaNasty/emojer/statuses/{sha}",
          "languages_url": "https://api.github.com/repos/CanastaNasty/emojer/languages",
          "stargazers_url": "https://api.github.com/repos/CanastaNasty/emojer/stargazers",
          "contributors_url": "https://api.github.com/repos/CanastaNasty/emojer/contributors",
          "subscribers_url": "https://api.github.com/repos/CanastaNasty/emojer/subscribers",
          "subscription_url": "https://api.github.com/repos/CanastaNasty/emojer/subscription",
          "commits_url": "https://api.github.com/repos/CanastaNasty/emojer/commits{/sha}",
          "git_commits_url": "https://api.github.com/repos/CanastaNasty/emojer/git/commits{/sha}",
          "comments_url": "https://api.github.com/repos/CanastaNasty/emojer/comments{/number}",
          "issue_comment_url": "https://api.github.com/repos/CanastaNasty/emojer/issues/comments/{number}",
          "contents_url": "https://api.github.com/repos/CanastaNasty/emojer/contents/{+path}",
          "compare_url": "https://api.github.com/repos/CanastaNasty/emojer/compare/{base}...{head}",
          "merges_url": "https://api.github.com/repos/CanastaNasty/emojer/merges",
          "archive_url": "https://api.github.com/repos/CanastaNasty/emojer/{archive_format}{/ref}",
          "downloads_url": "https://api.github.com/repos/CanastaNasty/emojer/downloads",
          "issues_url": "https://api.github.com/repos/CanastaNasty/emojer/issues{/number}",
          "pulls_url": "https://api.github.com/repos/CanastaNasty/emojer/pulls{/number}",
          "milestones_url": "https://api.github.com/repos/CanastaNasty/emojer/milestones{/number}",
          "notifications_url": "https://api.github.com/repos/CanastaNasty/emojer/notifications{?since,all,participating}",
          "labels_url": "https://api.github.com/repos/CanastaNasty/emojer/labels{/name}",
          "releases_url": "https://api.github.com/repos/CanastaNasty/emojer/releases{/id}",
          "created_at": "2013-09-18T23:17:00Z",
          "updated_at": "2013-09-20T21:06:32Z",
          "pushed_at": "2013-09-19T00:22:07Z",
          "git_url": "git://github.com/CanastaNasty/emojer.git",
          "ssh_url": "git@github.com:CanastaNasty/emojer.git",
          "clone_url": "https://github.com/CanastaNasty/emojer.git",
          "svn_url": "https://github.com/CanastaNasty/emojer",
          "homepage": null,
          "size": 252,
          "stargazers_count": 0,
          "watchers_count": 0,
          "language": "JavaScript",
          "has_issues": true,
          "has_downloads": true,
          "has_wiki": true,
          "forks_count": 1,
          "mirror_url": null,
          "open_issues_count": 0,
          "forks": 1,
          "open_issues": 0,
          "watchers": 0,
          "default_branch": "master",
          "master_branch": "master"
        },
        "network_count": 1,
        "subscribers_count": 1,
        "branch": "v0.2.0",
        "defaultBranch": "master"
      },
      "dependencies": {}
    },
    "observable": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "observable\n==========\n",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "mode": "100644",
          "content": "Observable\n==========\n\n`Observable` allows for observing arrays, functions, and objects.\n\nFunction dependencies are automagically observed.\n\nStandard array methods are proxied through to the underlying array.\n\n    Observable = (value) ->\n\nReturn the object if it is already an observable object.\n\n      return value if typeof value?.observe is \"function\"\n\nMaintain a set of listeners to observe changes and provide a helper to notify each observer.\n\n      listeners = []\n\n      notify = (newValue) ->\n        listeners.forEach (listener) ->\n          listener(newValue)\n\nOur observable function is stored as a reference to `self`.\n\nIf `value` is a function compute dependencies and listen to observables that it depends on.\n\n      if typeof value is 'function'\n        fn = value\n        self = ->\n          # Automagic dependency observation\n          magicDependency(self)\n\n          return value\n\n        self.observe = (listener) ->\n          listeners.push listener\n\n        changed = ->\n          value = fn()\n          notify(value)\n\n        value = computeDependencies(fn, changed)\n\n      else\n\nWhen called with zero arguments it is treated as a getter. When called with one argument it is treated as a setter.\n\nChanges to the value will trigger notifications.\n\nThe value is always returned.\n\n        self = (newValue) ->\n          if arguments.length > 0\n            if value != newValue\n              value = newValue\n\n              notify(newValue)\n          else\n            # Automagic dependency observation\n            magicDependency(self)\n\n          return value\n\nAdd a listener for when this object changes.\n\n        self.observe = (listener) ->\n          listeners.push listener\n\nThis `each` iterator is similar to [the Maybe monad](http://en.wikipedia.org/wiki/Monad_&#40;functional_programming&#41;#The_Maybe_monad) in that our observable may contain a single value or nothing at all.\n\n      self.each = (args...) ->\n        if value?\n          [value].forEach(args...)\n\nIf the value is an array then proxy array methods and add notifications to mutation events.\n\n      if Array.isArray(value)\n        [\n          \"concat\"\n          \"every\"\n          \"filter\"\n          \"forEach\"\n          \"indexOf\"\n          \"join\"\n          \"lastIndexOf\"\n          \"map\"\n          \"reduce\"\n          \"reduceRight\"\n          \"slice\"\n          \"some\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            value[method](args...)\n\n        [\n          \"pop\"\n          \"push\"\n          \"reverse\"\n          \"shift\"\n          \"splice\"\n          \"sort\"\n          \"unshift\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            notifyReturning value[method](args...)\n\n        notifyReturning = (returnValue) ->\n          notify(value)\n\n          return returnValue\n\nAdd some extra helpful methods to array observables.\n\n        extend self,\n          each: (args...) ->\n            self.forEach(args...)\n\n            return self\n\nRemove an element from the array and notify observers of changes.\n\n          remove: (object) ->\n            index = value.indexOf(object)\n\n            if index >= 0\n              notifyReturning value.splice(index, 1)[0]\n\n          get: (index) ->\n            value[index]\n\n          first: ->\n            value[0]\n\n          last: ->\n            value[value.length-1]\n\n      self.stopObserving = (fn) ->\n        remove listeners, fn\n\n      return self\n\nExport `Observable`\n\n    module.exports = Observable\n\nAppendix\n--------\n\nThe extend method adds one objects properties to another.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nSuper hax for computing dependencies. This needs to be a shared global so that\ndifferent bundled versions of observable libraries can interoperate.\n\n    global.OBSERVABLE_ROOT_HACK = undefined\n\n    magicDependency = (self) ->\n      if base = global.OBSERVABLE_ROOT_HACK\n        self.observe base\n\n    withBase = (root, fn) ->\n      global.OBSERVABLE_ROOT_HACK = root\n      value = fn()\n      global.OBSERVABLE_ROOT_HACK = undefined\n\n      return value\n\n    base = ->\n      global.OBSERVABLE_ROOT_HACK\n\nAutomagically compute dependencies.\n\n    computeDependencies = (fn, root) ->\n      withBase root, ->\n        fn()\n\nRemove a value from an array.\n\n    remove = (array, value) ->\n      index = array.indexOf(value)\n\n      if index >= 0\n        array.splice(index, 1)[0]\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.1.1\"\n",
          "type": "blob"
        },
        "test/observable.coffee": {
          "path": "test/observable.coffee",
          "mode": "100644",
          "content": "Observable = require \"../main\"\n\ndescribe 'Observable', ->\n  it 'should create an observable for an object', ->\n    n = 5\n\n    observable = Observable(n)\n\n    assert.equal(observable(), n)\n\n  it 'should fire events when setting', ->\n    string = \"yolo\"\n\n    observable = Observable(string)\n    observable.observe (newValue) ->\n      assert.equal newValue, \"4life\"\n\n    observable(\"4life\")\n\n  it 'should be idempotent', ->\n    o = Observable(5)\n\n    assert.equal o, Observable(o)\n\n  describe \"#each\", ->\n    it \"should be invoked once if there is an observable\", ->\n      o = Observable(5)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n        assert.equal value, 5\n\n      assert.equal called, 1\n\n    it \"should not be invoked if observable is null\", ->\n      o = Observable(null)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n\n      assert.equal called, 0\n\n  it \"should allow for stopping observation\", ->\n    observable = Observable(\"string\")\n\n    called = 0\n    fn = (newValue) ->\n      called += 1\n      assert.equal newValue, \"4life\"\n\n    observable.observe fn\n\n    observable(\"4life\")\n\n    observable.stopObserving fn\n\n    observable(\"wat\")\n\n    assert.equal called, 1\n\ndescribe \"Observable Array\", ->\n  it \"should proxy array methods\", ->\n    o = Observable [5]\n\n    o.map (n) ->\n      assert.equal n, 5\n\n  it \"should notify on mutation methods\", (done) ->\n    o = Observable []\n\n    o.observe (newValue) ->\n      assert.equal newValue[0], 1\n\n    o.push 1\n\n    done()\n\n  it \"should have an each method\", ->\n    o = Observable []\n\n    assert o.each\n\n  it \"#get\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.get(2), 2\n\n  it \"#first\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.first(), 0\n\n  it \"#last\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.last(), 3\n\n  it \"#remove\", (done) ->\n    o = Observable [0, 1, 2, 3]\n\n    o.observe (newValue) ->\n      assert.equal newValue.length, 3\n      setTimeout ->\n        done()\n      , 0\n\n    assert.equal o.remove(2), 2\n\n  # TODO: This looks like it might be impossible\n  it \"should proxy the length property\"\n\ndescribe \"Observable functions\", ->\n  it \"should compute dependencies\", (done) ->\n    firstName = Observable \"Duder\"\n    lastName = Observable \"Man\"\n\n    o = Observable ->\n      \"#{firstName()} #{lastName()}\"\n\n    o.observe (newValue) ->\n      assert.equal newValue, \"Duder Bro\"\n\n      done()\n\n    lastName \"Bro\"\n\n  it \"should allow double nesting\", (done) ->\n    bottom = Observable \"rad\"\n    middle = Observable ->\n      bottom()\n    top = Observable ->\n      middle()\n\n    top.observe (newValue) ->\n      assert.equal newValue, \"wat\"\n      assert.equal top(), newValue\n      assert.equal middle(), newValue\n\n      done()\n\n    bottom(\"wat\")\n\n  it \"should have an each method\", ->\n    o = Observable ->\n\n    assert o.each\n\n  it \"should not invoke when returning undefined\", ->\n    o = Observable ->\n\n    o.each ->\n      assert false\n\n  it \"should invoke when returning any defined value\", (done) ->\n    o = Observable -> 5\n\n    o.each (n) ->\n      assert.equal n, 5\n      done()\n\n  it \"should work on an array dependency\", ->\n    oA = Observable [1, 2, 3]\n\n    o = Observable ->\n      oA()[0]\n\n    last = Observable ->\n      oA()[oA().length-1]\n\n    assert.equal o(), 1\n\n    oA.unshift 0\n\n    assert.equal o(), 0\n\n    oA.push 4\n\n    assert.equal last(), 4, \"Last should be 4\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "(function() {\n  var Observable, base, computeDependencies, extend, magicDependency, remove, withBase,\n    __slice = [].slice;\n\n  Observable = function(value) {\n    var changed, fn, listeners, notify, notifyReturning, self;\n    if (typeof (value != null ? value.observe : void 0) === \"function\") {\n      return value;\n    }\n    listeners = [];\n    notify = function(newValue) {\n      return listeners.forEach(function(listener) {\n        return listener(newValue);\n      });\n    };\n    if (typeof value === 'function') {\n      fn = value;\n      self = function() {\n        magicDependency(self);\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n      changed = function() {\n        value = fn();\n        return notify(value);\n      };\n      value = computeDependencies(fn, changed);\n    } else {\n      self = function(newValue) {\n        if (arguments.length > 0) {\n          if (value !== newValue) {\n            value = newValue;\n            notify(newValue);\n          }\n        } else {\n          magicDependency(self);\n        }\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n    }\n    self.each = function() {\n      var args, _ref;\n      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      if (value != null) {\n        return (_ref = [value]).forEach.apply(_ref, args);\n      }\n    };\n    if (Array.isArray(value)) {\n      [\"concat\", \"every\", \"filter\", \"forEach\", \"indexOf\", \"join\", \"lastIndexOf\", \"map\", \"reduce\", \"reduceRight\", \"slice\", \"some\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return value[method].apply(value, args);\n        };\n      });\n      [\"pop\", \"push\", \"reverse\", \"shift\", \"splice\", \"sort\", \"unshift\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return notifyReturning(value[method].apply(value, args));\n        };\n      });\n      notifyReturning = function(returnValue) {\n        notify(value);\n        return returnValue;\n      };\n      extend(self, {\n        each: function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          self.forEach.apply(self, args);\n          return self;\n        },\n        remove: function(object) {\n          var index;\n          index = value.indexOf(object);\n          if (index >= 0) {\n            return notifyReturning(value.splice(index, 1)[0]);\n          }\n        },\n        get: function(index) {\n          return value[index];\n        },\n        first: function() {\n          return value[0];\n        },\n        last: function() {\n          return value[value.length - 1];\n        }\n      });\n    }\n    self.stopObserving = function(fn) {\n      return remove(listeners, fn);\n    };\n    return self;\n  };\n\n  module.exports = Observable;\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  global.OBSERVABLE_ROOT_HACK = void 0;\n\n  magicDependency = function(self) {\n    var base;\n    if (base = global.OBSERVABLE_ROOT_HACK) {\n      return self.observe(base);\n    }\n  };\n\n  withBase = function(root, fn) {\n    var value;\n    global.OBSERVABLE_ROOT_HACK = root;\n    value = fn();\n    global.OBSERVABLE_ROOT_HACK = void 0;\n    return value;\n  };\n\n  base = function() {\n    return global.OBSERVABLE_ROOT_HACK;\n  };\n\n  computeDependencies = function(fn, root) {\n    return withBase(root, function() {\n      return fn();\n    });\n  };\n\n  remove = function(array, value) {\n    var index;\n    index = array.indexOf(value);\n    if (index >= 0) {\n      return array.splice(index, 1)[0];\n    }\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.1.1\"};",
          "type": "blob"
        },
        "test/observable": {
          "path": "test/observable",
          "content": "(function() {\n  var Observable;\n\n  Observable = require(\"../main\");\n\n  describe('Observable', function() {\n    it('should create an observable for an object', function() {\n      var n, observable;\n      n = 5;\n      observable = Observable(n);\n      return assert.equal(observable(), n);\n    });\n    it('should fire events when setting', function() {\n      var observable, string;\n      string = \"yolo\";\n      observable = Observable(string);\n      observable.observe(function(newValue) {\n        return assert.equal(newValue, \"4life\");\n      });\n      return observable(\"4life\");\n    });\n    it('should be idempotent', function() {\n      var o;\n      o = Observable(5);\n      return assert.equal(o, Observable(o));\n    });\n    describe(\"#each\", function() {\n      it(\"should be invoked once if there is an observable\", function() {\n        var called, o;\n        o = Observable(5);\n        called = 0;\n        o.each(function(value) {\n          called += 1;\n          return assert.equal(value, 5);\n        });\n        return assert.equal(called, 1);\n      });\n      return it(\"should not be invoked if observable is null\", function() {\n        var called, o;\n        o = Observable(null);\n        called = 0;\n        o.each(function(value) {\n          return called += 1;\n        });\n        return assert.equal(called, 0);\n      });\n    });\n    return it(\"should allow for stopping observation\", function() {\n      var called, fn, observable;\n      observable = Observable(\"string\");\n      called = 0;\n      fn = function(newValue) {\n        called += 1;\n        return assert.equal(newValue, \"4life\");\n      };\n      observable.observe(fn);\n      observable(\"4life\");\n      observable.stopObserving(fn);\n      observable(\"wat\");\n      return assert.equal(called, 1);\n    });\n  });\n\n  describe(\"Observable Array\", function() {\n    it(\"should proxy array methods\", function() {\n      var o;\n      o = Observable([5]);\n      return o.map(function(n) {\n        return assert.equal(n, 5);\n      });\n    });\n    it(\"should notify on mutation methods\", function(done) {\n      var o;\n      o = Observable([]);\n      o.observe(function(newValue) {\n        return assert.equal(newValue[0], 1);\n      });\n      o.push(1);\n      return done();\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable([]);\n      return assert(o.each);\n    });\n    it(\"#get\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.get(2), 2);\n    });\n    it(\"#first\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.first(), 0);\n    });\n    it(\"#last\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.last(), 3);\n    });\n    it(\"#remove\", function(done) {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      o.observe(function(newValue) {\n        assert.equal(newValue.length, 3);\n        return setTimeout(function() {\n          return done();\n        }, 0);\n      });\n      return assert.equal(o.remove(2), 2);\n    });\n    return it(\"should proxy the length property\");\n  });\n\n  describe(\"Observable functions\", function() {\n    it(\"should compute dependencies\", function(done) {\n      var firstName, lastName, o;\n      firstName = Observable(\"Duder\");\n      lastName = Observable(\"Man\");\n      o = Observable(function() {\n        return \"\" + (firstName()) + \" \" + (lastName());\n      });\n      o.observe(function(newValue) {\n        assert.equal(newValue, \"Duder Bro\");\n        return done();\n      });\n      return lastName(\"Bro\");\n    });\n    it(\"should allow double nesting\", function(done) {\n      var bottom, middle, top;\n      bottom = Observable(\"rad\");\n      middle = Observable(function() {\n        return bottom();\n      });\n      top = Observable(function() {\n        return middle();\n      });\n      top.observe(function(newValue) {\n        assert.equal(newValue, \"wat\");\n        assert.equal(top(), newValue);\n        assert.equal(middle(), newValue);\n        return done();\n      });\n      return bottom(\"wat\");\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable(function() {});\n      return assert(o.each);\n    });\n    it(\"should not invoke when returning undefined\", function() {\n      var o;\n      o = Observable(function() {});\n      return o.each(function() {\n        return assert(false);\n      });\n    });\n    it(\"should invoke when returning any defined value\", function(done) {\n      var o;\n      o = Observable(function() {\n        return 5;\n      });\n      return o.each(function(n) {\n        assert.equal(n, 5);\n        return done();\n      });\n    });\n    return it(\"should work on an array dependency\", function() {\n      var last, o, oA;\n      oA = Observable([1, 2, 3]);\n      o = Observable(function() {\n        return oA()[0];\n      });\n      last = Observable(function() {\n        return oA()[oA().length - 1];\n      });\n      assert.equal(o(), 1);\n      oA.unshift(0);\n      assert.equal(o(), 0);\n      oA.push(4);\n      return assert.equal(last(), 4, \"Last should be 4\");\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.1",
      "entryPoint": "main",
      "repository": {
        "id": 17119562,
        "name": "observable",
        "full_name": "distri/observable",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/observable",
        "description": "",
        "fork": false,
        "url": "https://api.github.com/repos/distri/observable",
        "forks_url": "https://api.github.com/repos/distri/observable/forks",
        "keys_url": "https://api.github.com/repos/distri/observable/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/observable/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/observable/teams",
        "hooks_url": "https://api.github.com/repos/distri/observable/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/observable/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/observable/events",
        "assignees_url": "https://api.github.com/repos/distri/observable/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/observable/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/observable/tags",
        "blobs_url": "https://api.github.com/repos/distri/observable/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/observable/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/observable/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/observable/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/observable/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/observable/languages",
        "stargazers_url": "https://api.github.com/repos/distri/observable/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/observable/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/observable/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/observable/subscription",
        "commits_url": "https://api.github.com/repos/distri/observable/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/observable/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/observable/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/observable/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/observable/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/observable/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/observable/merges",
        "archive_url": "https://api.github.com/repos/distri/observable/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/observable/downloads",
        "issues_url": "https://api.github.com/repos/distri/observable/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/observable/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/observable/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/observable/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/observable/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/observable/releases{/id}",
        "created_at": "2014-02-23T23:17:52Z",
        "updated_at": "2014-04-02T00:41:29Z",
        "pushed_at": "2014-04-02T00:41:31Z",
        "git_url": "git://github.com/distri/observable.git",
        "ssh_url": "git@github.com:distri/observable.git",
        "clone_url": "https://github.com/distri/observable.git",
        "svn_url": "https://github.com/distri/observable",
        "homepage": null,
        "size": 164,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 2,
        "branch": "v0.1.1",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    },
    "composition": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.coffee.md": {
          "path": "README.coffee.md",
          "mode": "100644",
          "content": "Compositions\n============\n\nThe `compositions` module provides helper methods to compose nested data models.\n\nCompositions uses [Observable](/observable/docs) to keep the internal data in sync.\n\n    Core = require \"core\"\n    Observable = require \"observable\"\n\n    module.exports = (I={}, self=Core(I)) ->\n\n      self.extend\n\nObserve any number of attributes as simple observables. For each attribute name passed in we expose a public getter/setter method and listen to changes when the value is set.\n\n        attrObservable: (names...) ->\n          names.forEach (name) ->\n            self[name] = Observable(I[name])\n\n            self[name].observe (newValue) ->\n              I[name] = newValue\n\n          return self\n\nObserve an attribute as a model. Treats the attribute given as an Observable\nmodel instance exposting a getter/setter method of the same name. The Model\nconstructor must be passed in explicitly.\n\n        attrModel: (name, Model) ->\n          model = Model(I[name])\n\n          self[name] = Observable(model)\n\n          self[name].observe (newValue) ->\n            I[name] = newValue.I\n\n          return self\n\nObserve an attribute as a list of sub-models. This is the same as `attrModel`\nexcept the attribute is expected to be an array of models rather than a single one.\n\n        attrModels: (name, Model) ->\n          models = (I[name] or []).map (x) ->\n            Model(x)\n\n          self[name] = Observable(models)\n\n          self[name].observe (newValue) ->\n            I[name] = newValue.map (instance) ->\n              instance.I\n\n          return self\n\nThe JSON representation is kept up to date via the observable properites and resides in `I`.\n\n        toJSON: ->\n          I\n\nReturn our public object.\n\n      return self\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "entryPoint: \"README\"\nversion: \"0.1.1\"\ndependencies:\n  core: \"distri/core:v0.6.0\"\n  observable: \"distri/observable:v0.1.1\"\n",
          "type": "blob"
        },
        "test/compositions.coffee": {
          "path": "test/compositions.coffee",
          "mode": "100644",
          "content": "\nModel = require \"../README\"\n\ndescribe 'Model', ->\n  # Association Testing model\n  Person = (I) ->\n    person = Model(I)\n\n    person.attrAccessor(\n      'firstName'\n      'lastName'\n      'suffix'\n    )\n\n    person.fullName = ->\n      \"#{@firstName()} #{@lastName()} #{@suffix()}\"\n\n    return person\n\n  describe \"#attrObservable\", ->\n    it 'should allow for observing of attributes', ->\n      model = Model\n        name: \"Duder\"\n\n      model.attrObservable \"name\"\n\n      model.name(\"Dudeman\")\n\n      assert.equal model.name(), \"Dudeman\"\n\n    it 'should bind properties to observable attributes', ->\n      model = Model\n        name: \"Duder\"\n\n      model.attrObservable \"name\"\n\n      model.name(\"Dudeman\")\n\n      assert.equal model.name(), \"Dudeman\"\n      assert.equal model.name(), model.I.name\n\n  describe \"#attrModel\", ->\n    it \"should be a model instance\", ->\n      model = Model\n        person:\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n\n      model.attrModel(\"person\", Person)\n\n      assert.equal model.person().fullName(), \"Duder Mannington Jr.\"\n\n    it \"should allow setting the associated model\", ->\n      model = Model\n        person:\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n\n      model.attrModel(\"person\", Person)\n\n      otherPerson = Person\n        firstName: \"Mr.\"\n        lastName: \"Man\"\n\n      model.person(otherPerson)\n\n      assert.equal model.person().firstName(), \"Mr.\"\n\n    it \"shouldn't update the instance properties after it's been replaced\", ->\n      model = Model\n        person:\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n\n      model.attrModel(\"person\", Person)\n\n      duder = model.person()\n\n      otherPerson = Person\n        firstName: \"Mr.\"\n        lastName: \"Man\"\n\n      model.person(otherPerson)\n\n      duder.firstName(\"Joe\")\n\n      assert.equal duder.I.firstName, \"Joe\"\n      assert.equal model.I.person.firstName, \"Mr.\"\n\n  describe \"#attrModels\", ->\n    it \"should have an array of model instances\", ->\n      model = Model\n        people: [{\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n        }, {\n          firstName: \"Mr.\"\n          lastName: \"Mannington\"\n          suffix: \"Sr.\"\n        }]\n\n      model.attrModels(\"people\", Person)\n\n      assert.equal model.people()[0].fullName(), \"Duder Mannington Jr.\"\n\n    it \"should track pushes\", ->\n      model = Model\n        people: [{\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n        }, {\n          firstName: \"Mr.\"\n          lastName: \"Mannington\"\n          suffix: \"Sr.\"\n        }]\n\n      model.attrModels(\"people\", Person)\n\n      model.people.push Person\n        firstName: \"JoJo\"\n        lastName: \"Loco\"\n\n      assert.equal model.people().length, 3\n      assert.equal model.I.people.length, 3\n\n    it \"should track pops\", ->\n      model = Model\n        people: [{\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n        }, {\n          firstName: \"Mr.\"\n          lastName: \"Mannington\"\n          suffix: \"Sr.\"\n        }]\n\n      model.attrModels(\"people\", Person)\n\n      model.people.pop()\n\n      assert.equal model.people().length, 1\n      assert.equal model.I.people.length, 1\n\n  describe \"#toJSON\", ->\n    it \"should return an object appropriate for JSON serialization\", ->\n      model = Model\n        test: true\n\n      assert model.toJSON().test\n\n  describe \"#observeAll\", ->\n    it \"should observe all attributes of a simple model\"\n    ->  # TODO\n      model = Model\n        test: true\n        yolo: \"4life\"\n\n      model.observeAll()\n\n      assert model.test()\n      assert.equal model.yolo(), \"4life\"\n\n    it \"should camel case underscored names\"",
          "type": "blob"
        }
      },
      "distribution": {
        "README": {
          "path": "README",
          "content": "(function() {\n  var Core, Observable,\n    __slice = [].slice;\n\n  Core = require(\"core\");\n\n  Observable = require(\"observable\");\n\n  module.exports = function(I, self) {\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = Core(I);\n    }\n    self.extend({\n      attrObservable: function() {\n        var names;\n        names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        names.forEach(function(name) {\n          self[name] = Observable(I[name]);\n          return self[name].observe(function(newValue) {\n            return I[name] = newValue;\n          });\n        });\n        return self;\n      },\n      attrModel: function(name, Model) {\n        var model;\n        model = Model(I[name]);\n        self[name] = Observable(model);\n        self[name].observe(function(newValue) {\n          return I[name] = newValue.I;\n        });\n        return self;\n      },\n      attrModels: function(name, Model) {\n        var models;\n        models = (I[name] || []).map(function(x) {\n          return Model(x);\n        });\n        self[name] = Observable(models);\n        self[name].observe(function(newValue) {\n          return I[name] = newValue.map(function(instance) {\n            return instance.I;\n          });\n        });\n        return self;\n      },\n      toJSON: function() {\n        return I;\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"entryPoint\":\"README\",\"version\":\"0.1.1\",\"dependencies\":{\"core\":\"distri/core:v0.6.0\",\"observable\":\"distri/observable:v0.1.1\"}};",
          "type": "blob"
        },
        "test/compositions": {
          "path": "test/compositions",
          "content": "(function() {\n  var Model;\n\n  Model = require(\"../README\");\n\n  describe('Model', function() {\n    var Person;\n    Person = function(I) {\n      var person;\n      person = Model(I);\n      person.attrAccessor('firstName', 'lastName', 'suffix');\n      person.fullName = function() {\n        return \"\" + (this.firstName()) + \" \" + (this.lastName()) + \" \" + (this.suffix());\n      };\n      return person;\n    };\n    describe(\"#attrObservable\", function() {\n      it('should allow for observing of attributes', function() {\n        var model;\n        model = Model({\n          name: \"Duder\"\n        });\n        model.attrObservable(\"name\");\n        model.name(\"Dudeman\");\n        return assert.equal(model.name(), \"Dudeman\");\n      });\n      return it('should bind properties to observable attributes', function() {\n        var model;\n        model = Model({\n          name: \"Duder\"\n        });\n        model.attrObservable(\"name\");\n        model.name(\"Dudeman\");\n        assert.equal(model.name(), \"Dudeman\");\n        return assert.equal(model.name(), model.I.name);\n      });\n    });\n    describe(\"#attrModel\", function() {\n      it(\"should be a model instance\", function() {\n        var model;\n        model = Model({\n          person: {\n            firstName: \"Duder\",\n            lastName: \"Mannington\",\n            suffix: \"Jr.\"\n          }\n        });\n        model.attrModel(\"person\", Person);\n        return assert.equal(model.person().fullName(), \"Duder Mannington Jr.\");\n      });\n      it(\"should allow setting the associated model\", function() {\n        var model, otherPerson;\n        model = Model({\n          person: {\n            firstName: \"Duder\",\n            lastName: \"Mannington\",\n            suffix: \"Jr.\"\n          }\n        });\n        model.attrModel(\"person\", Person);\n        otherPerson = Person({\n          firstName: \"Mr.\",\n          lastName: \"Man\"\n        });\n        model.person(otherPerson);\n        return assert.equal(model.person().firstName(), \"Mr.\");\n      });\n      return it(\"shouldn't update the instance properties after it's been replaced\", function() {\n        var duder, model, otherPerson;\n        model = Model({\n          person: {\n            firstName: \"Duder\",\n            lastName: \"Mannington\",\n            suffix: \"Jr.\"\n          }\n        });\n        model.attrModel(\"person\", Person);\n        duder = model.person();\n        otherPerson = Person({\n          firstName: \"Mr.\",\n          lastName: \"Man\"\n        });\n        model.person(otherPerson);\n        duder.firstName(\"Joe\");\n        assert.equal(duder.I.firstName, \"Joe\");\n        return assert.equal(model.I.person.firstName, \"Mr.\");\n      });\n    });\n    describe(\"#attrModels\", function() {\n      it(\"should have an array of model instances\", function() {\n        var model;\n        model = Model({\n          people: [\n            {\n              firstName: \"Duder\",\n              lastName: \"Mannington\",\n              suffix: \"Jr.\"\n            }, {\n              firstName: \"Mr.\",\n              lastName: \"Mannington\",\n              suffix: \"Sr.\"\n            }\n          ]\n        });\n        model.attrModels(\"people\", Person);\n        return assert.equal(model.people()[0].fullName(), \"Duder Mannington Jr.\");\n      });\n      it(\"should track pushes\", function() {\n        var model;\n        model = Model({\n          people: [\n            {\n              firstName: \"Duder\",\n              lastName: \"Mannington\",\n              suffix: \"Jr.\"\n            }, {\n              firstName: \"Mr.\",\n              lastName: \"Mannington\",\n              suffix: \"Sr.\"\n            }\n          ]\n        });\n        model.attrModels(\"people\", Person);\n        model.people.push(Person({\n          firstName: \"JoJo\",\n          lastName: \"Loco\"\n        }));\n        assert.equal(model.people().length, 3);\n        return assert.equal(model.I.people.length, 3);\n      });\n      return it(\"should track pops\", function() {\n        var model;\n        model = Model({\n          people: [\n            {\n              firstName: \"Duder\",\n              lastName: \"Mannington\",\n              suffix: \"Jr.\"\n            }, {\n              firstName: \"Mr.\",\n              lastName: \"Mannington\",\n              suffix: \"Sr.\"\n            }\n          ]\n        });\n        model.attrModels(\"people\", Person);\n        model.people.pop();\n        assert.equal(model.people().length, 1);\n        return assert.equal(model.I.people.length, 1);\n      });\n    });\n    describe(\"#toJSON\", function() {\n      return it(\"should return an object appropriate for JSON serialization\", function() {\n        var model;\n        model = Model({\n          test: true\n        });\n        return assert(model.toJSON().test);\n      });\n    });\n    return describe(\"#observeAll\", function() {\n      it(\"should observe all attributes of a simple model\");\n      (function() {\n        var model;\n        model = Model({\n          test: true,\n          yolo: \"4life\"\n        });\n        model.observeAll();\n        assert(model.test());\n        return assert.equal(model.yolo(), \"4life\");\n      });\n      return it(\"should camel case underscored names\");\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.1",
      "entryPoint": "README",
      "repository": {
        "id": 17256636,
        "name": "compositions",
        "full_name": "distri/compositions",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/compositions",
        "description": "",
        "fork": false,
        "url": "https://api.github.com/repos/distri/compositions",
        "forks_url": "https://api.github.com/repos/distri/compositions/forks",
        "keys_url": "https://api.github.com/repos/distri/compositions/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/compositions/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/compositions/teams",
        "hooks_url": "https://api.github.com/repos/distri/compositions/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/compositions/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/compositions/events",
        "assignees_url": "https://api.github.com/repos/distri/compositions/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/compositions/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/compositions/tags",
        "blobs_url": "https://api.github.com/repos/distri/compositions/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/compositions/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/compositions/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/compositions/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/compositions/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/compositions/languages",
        "stargazers_url": "https://api.github.com/repos/distri/compositions/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/compositions/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/compositions/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/compositions/subscription",
        "commits_url": "https://api.github.com/repos/distri/compositions/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/compositions/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/compositions/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/compositions/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/compositions/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/compositions/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/compositions/merges",
        "archive_url": "https://api.github.com/repos/distri/compositions/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/compositions/downloads",
        "issues_url": "https://api.github.com/repos/distri/compositions/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/compositions/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/compositions/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/compositions/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/compositions/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/compositions/releases{/id}",
        "created_at": "2014-02-27T17:00:47Z",
        "updated_at": "2014-02-27T17:16:50Z",
        "pushed_at": "2014-02-27T17:16:49Z",
        "git_url": "git://github.com/distri/compositions.git",
        "ssh_url": "git@github.com:distri/compositions.git",
        "clone_url": "https://github.com/distri/compositions.git",
        "svn_url": "https://github.com/distri/compositions",
        "homepage": null,
        "size": 140,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 1,
        "branch": "v0.1.1",
        "publishBranch": "gh-pages"
      },
      "dependencies": {
        "core": {
          "source": {
            "LICENSE": {
              "path": "LICENSE",
              "mode": "100644",
              "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
              "type": "blob"
            },
            "README.md": {
              "path": "README.md",
              "mode": "100644",
              "content": "core\n====\n\nAn object extension system.\n",
              "type": "blob"
            },
            "core.coffee.md": {
              "path": "core.coffee.md",
              "mode": "100644",
              "content": "Core\n====\n\nThe Core module is used to add extended functionality to objects without\nextending `Object.prototype` directly.\n\n    Core = (I={}, self={}) ->\n      extend self,\n\nExternal access to instance variables. Use of this property should be avoided\nin general, but can come in handy from time to time.\n\n>     #! example\n>     I =\n>       r: 255\n>       g: 0\n>       b: 100\n>\n>     myObject = Core(I)\n>\n>     [myObject.I.r, myObject.I.g, myObject.I.b]\n\n        I: I\n\nGenerates a public jQuery style getter / setter method for each `String` argument.\n\n>     #! example\n>     myObject = Core\n>       r: 255\n>       g: 0\n>       b: 100\n>\n>     myObject.attrAccessor \"r\", \"g\", \"b\"\n>\n>     myObject.r(254)\n\n        attrAccessor: (attrNames...) ->\n          attrNames.forEach (attrName) ->\n            self[attrName] = (newValue) ->\n              if arguments.length > 0\n                I[attrName] = newValue\n\n                return self\n              else\n                I[attrName]\n\n          return self\n\nGenerates a public jQuery style getter method for each String argument.\n\n>     #! example\n>     myObject = Core\n>       r: 255\n>       g: 0\n>       b: 100\n>\n>     myObject.attrReader \"r\", \"g\", \"b\"\n>\n>     [myObject.r(), myObject.g(), myObject.b()]\n\n        attrReader: (attrNames...) ->\n          attrNames.forEach (attrName) ->\n            self[attrName] = ->\n              I[attrName]\n\n          return self\n\nExtends this object with methods from the passed in object. A shortcut for Object.extend(self, methods)\n\n>     I =\n>       x: 30\n>       y: 40\n>       maxSpeed: 5\n>\n>     # we are using extend to give player\n>     # additional methods that Core doesn't have\n>     player = Core(I).extend\n>       increaseSpeed: ->\n>         I.maxSpeed += 1\n>\n>     player.increaseSpeed()\n\n        extend: (objects...) ->\n          extend self, objects...\n\nIncludes a module in this object. A module is a constructor that takes two parameters, `I` and `self`\n\n>     myObject = Core()\n>     myObject.include(Bindable)\n\n>     # now you can bind handlers to functions\n>     myObject.bind \"someEvent\", ->\n>       alert(\"wow. that was easy.\")\n\n        include: (modules...) ->\n          for Module in modules\n            Module(I, self)\n\n          return self\n\n      return self\n\nHelpers\n-------\n\nExtend an object with the properties of other objects.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nExport\n\n    module.exports = Core\n",
              "type": "blob"
            },
            "pixie.cson": {
              "path": "pixie.cson",
              "mode": "100644",
              "content": "entryPoint: \"core\"\nversion: \"0.6.0\"\n",
              "type": "blob"
            },
            "test/core.coffee": {
              "path": "test/core.coffee",
              "mode": "100644",
              "content": "Core = require \"../core\"\n\nok = assert\nequals = assert.equal\ntest = it\n\ndescribe \"Core\", ->\n\n  test \"#extend\", ->\n    o = Core()\n  \n    o.extend\n      test: \"jawsome\"\n  \n    equals o.test, \"jawsome\"\n  \n  test \"#attrAccessor\", ->\n    o = Core\n      test: \"my_val\"\n  \n    o.attrAccessor(\"test\")\n  \n    equals o.test(), \"my_val\"\n    equals o.test(\"new_val\"), o\n    equals o.test(), \"new_val\"\n  \n  test \"#attrReader\", ->\n    o = Core\n      test: \"my_val\"\n  \n    o.attrReader(\"test\")\n  \n    equals o.test(), \"my_val\"\n    equals o.test(\"new_val\"), \"my_val\"\n    equals o.test(), \"my_val\"\n  \n  test \"#include\", ->\n    o = Core\n      test: \"my_val\"\n  \n    M = (I, self) ->\n      self.attrReader \"test\"\n  \n      self.extend\n        test2: \"cool\"\n  \n    ret = o.include M\n  \n    equals ret, o, \"Should return self\"\n  \n    equals o.test(), \"my_val\"\n    equals o.test2, \"cool\"\n  \n  test \"#include multiple\", ->\n    o = Core\n      test: \"my_val\"\n  \n    M = (I, self) ->\n      self.attrReader \"test\"\n  \n      self.extend\n        test2: \"cool\"\n  \n    M2 = (I, self) ->\n      self.extend\n        test2: \"coolio\"\n  \n    o.include M, M2\n  \n    equals o.test2, \"coolio\"\n",
              "type": "blob"
            }
          },
          "distribution": {
            "core": {
              "path": "core",
              "content": "(function() {\n  var Core, extend,\n    __slice = [].slice;\n\n  Core = function(I, self) {\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = {};\n    }\n    extend(self, {\n      I: I,\n      attrAccessor: function() {\n        var attrNames;\n        attrNames = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        attrNames.forEach(function(attrName) {\n          return self[attrName] = function(newValue) {\n            if (arguments.length > 0) {\n              I[attrName] = newValue;\n              return self;\n            } else {\n              return I[attrName];\n            }\n          };\n        });\n        return self;\n      },\n      attrReader: function() {\n        var attrNames;\n        attrNames = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        attrNames.forEach(function(attrName) {\n          return self[attrName] = function() {\n            return I[attrName];\n          };\n        });\n        return self;\n      },\n      extend: function() {\n        var objects;\n        objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        return extend.apply(null, [self].concat(__slice.call(objects)));\n      },\n      include: function() {\n        var Module, modules, _i, _len;\n        modules = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        for (_i = 0, _len = modules.length; _i < _len; _i++) {\n          Module = modules[_i];\n          Module(I, self);\n        }\n        return self;\n      }\n    });\n    return self;\n  };\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  module.exports = Core;\n\n}).call(this);\n\n//# sourceURL=core.coffee",
              "type": "blob"
            },
            "pixie": {
              "path": "pixie",
              "content": "module.exports = {\"entryPoint\":\"core\",\"version\":\"0.6.0\"};",
              "type": "blob"
            },
            "test/core": {
              "path": "test/core",
              "content": "(function() {\n  var Core, equals, ok, test;\n\n  Core = require(\"../core\");\n\n  ok = assert;\n\n  equals = assert.equal;\n\n  test = it;\n\n  describe(\"Core\", function() {\n    test(\"#extend\", function() {\n      var o;\n      o = Core();\n      o.extend({\n        test: \"jawsome\"\n      });\n      return equals(o.test, \"jawsome\");\n    });\n    test(\"#attrAccessor\", function() {\n      var o;\n      o = Core({\n        test: \"my_val\"\n      });\n      o.attrAccessor(\"test\");\n      equals(o.test(), \"my_val\");\n      equals(o.test(\"new_val\"), o);\n      return equals(o.test(), \"new_val\");\n    });\n    test(\"#attrReader\", function() {\n      var o;\n      o = Core({\n        test: \"my_val\"\n      });\n      o.attrReader(\"test\");\n      equals(o.test(), \"my_val\");\n      equals(o.test(\"new_val\"), \"my_val\");\n      return equals(o.test(), \"my_val\");\n    });\n    test(\"#include\", function() {\n      var M, o, ret;\n      o = Core({\n        test: \"my_val\"\n      });\n      M = function(I, self) {\n        self.attrReader(\"test\");\n        return self.extend({\n          test2: \"cool\"\n        });\n      };\n      ret = o.include(M);\n      equals(ret, o, \"Should return self\");\n      equals(o.test(), \"my_val\");\n      return equals(o.test2, \"cool\");\n    });\n    return test(\"#include multiple\", function() {\n      var M, M2, o;\n      o = Core({\n        test: \"my_val\"\n      });\n      M = function(I, self) {\n        self.attrReader(\"test\");\n        return self.extend({\n          test2: \"cool\"\n        });\n      };\n      M2 = function(I, self) {\n        return self.extend({\n          test2: \"coolio\"\n        });\n      };\n      o.include(M, M2);\n      return equals(o.test2, \"coolio\");\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/core.coffee",
              "type": "blob"
            }
          },
          "progenitor": {
            "url": "http://strd6.github.io/editor/"
          },
          "version": "0.6.0",
          "entryPoint": "core",
          "repository": {
            "id": 13567517,
            "name": "core",
            "full_name": "distri/core",
            "owner": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://identicons.github.com/f90c81ffc1498e260c820082f2e7ca5f.png",
              "gravatar_id": null,
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "private": false,
            "html_url": "https://github.com/distri/core",
            "description": "An object extension system.",
            "fork": false,
            "url": "https://api.github.com/repos/distri/core",
            "forks_url": "https://api.github.com/repos/distri/core/forks",
            "keys_url": "https://api.github.com/repos/distri/core/keys{/key_id}",
            "collaborators_url": "https://api.github.com/repos/distri/core/collaborators{/collaborator}",
            "teams_url": "https://api.github.com/repos/distri/core/teams",
            "hooks_url": "https://api.github.com/repos/distri/core/hooks",
            "issue_events_url": "https://api.github.com/repos/distri/core/issues/events{/number}",
            "events_url": "https://api.github.com/repos/distri/core/events",
            "assignees_url": "https://api.github.com/repos/distri/core/assignees{/user}",
            "branches_url": "https://api.github.com/repos/distri/core/branches{/branch}",
            "tags_url": "https://api.github.com/repos/distri/core/tags",
            "blobs_url": "https://api.github.com/repos/distri/core/git/blobs{/sha}",
            "git_tags_url": "https://api.github.com/repos/distri/core/git/tags{/sha}",
            "git_refs_url": "https://api.github.com/repos/distri/core/git/refs{/sha}",
            "trees_url": "https://api.github.com/repos/distri/core/git/trees{/sha}",
            "statuses_url": "https://api.github.com/repos/distri/core/statuses/{sha}",
            "languages_url": "https://api.github.com/repos/distri/core/languages",
            "stargazers_url": "https://api.github.com/repos/distri/core/stargazers",
            "contributors_url": "https://api.github.com/repos/distri/core/contributors",
            "subscribers_url": "https://api.github.com/repos/distri/core/subscribers",
            "subscription_url": "https://api.github.com/repos/distri/core/subscription",
            "commits_url": "https://api.github.com/repos/distri/core/commits{/sha}",
            "git_commits_url": "https://api.github.com/repos/distri/core/git/commits{/sha}",
            "comments_url": "https://api.github.com/repos/distri/core/comments{/number}",
            "issue_comment_url": "https://api.github.com/repos/distri/core/issues/comments/{number}",
            "contents_url": "https://api.github.com/repos/distri/core/contents/{+path}",
            "compare_url": "https://api.github.com/repos/distri/core/compare/{base}...{head}",
            "merges_url": "https://api.github.com/repos/distri/core/merges",
            "archive_url": "https://api.github.com/repos/distri/core/{archive_format}{/ref}",
            "downloads_url": "https://api.github.com/repos/distri/core/downloads",
            "issues_url": "https://api.github.com/repos/distri/core/issues{/number}",
            "pulls_url": "https://api.github.com/repos/distri/core/pulls{/number}",
            "milestones_url": "https://api.github.com/repos/distri/core/milestones{/number}",
            "notifications_url": "https://api.github.com/repos/distri/core/notifications{?since,all,participating}",
            "labels_url": "https://api.github.com/repos/distri/core/labels{/name}",
            "releases_url": "https://api.github.com/repos/distri/core/releases{/id}",
            "created_at": "2013-10-14T17:04:33Z",
            "updated_at": "2013-12-24T00:49:21Z",
            "pushed_at": "2013-10-14T23:49:11Z",
            "git_url": "git://github.com/distri/core.git",
            "ssh_url": "git@github.com:distri/core.git",
            "clone_url": "https://github.com/distri/core.git",
            "svn_url": "https://github.com/distri/core",
            "homepage": null,
            "size": 592,
            "stargazers_count": 0,
            "watchers_count": 0,
            "language": "CoffeeScript",
            "has_issues": true,
            "has_downloads": true,
            "has_wiki": true,
            "forks_count": 0,
            "mirror_url": null,
            "open_issues_count": 0,
            "forks": 0,
            "open_issues": 0,
            "watchers": 0,
            "default_branch": "master",
            "master_branch": "master",
            "permissions": {
              "admin": true,
              "push": true,
              "pull": true
            },
            "organization": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://identicons.github.com/f90c81ffc1498e260c820082f2e7ca5f.png",
              "gravatar_id": null,
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "network_count": 0,
            "subscribers_count": 1,
            "branch": "v0.6.0",
            "defaultBranch": "master"
          },
          "dependencies": {}
        },
        "observable": {
          "source": {
            "LICENSE": {
              "path": "LICENSE",
              "mode": "100644",
              "content": "The MIT License (MIT)\n\nCopyright (c) 2014 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
              "type": "blob"
            },
            "README.md": {
              "path": "README.md",
              "mode": "100644",
              "content": "observable\n==========\n",
              "type": "blob"
            },
            "main.coffee.md": {
              "path": "main.coffee.md",
              "mode": "100644",
              "content": "Observable\n==========\n\n`Observable` allows for observing arrays, functions, and objects.\n\nFunction dependencies are automagically observed.\n\nStandard array methods are proxied through to the underlying array.\n\n    Observable = (value) ->\n\nReturn the object if it is already an observable object.\n\n      return value if typeof value?.observe is \"function\"\n\nMaintain a set of listeners to observe changes and provide a helper to notify each observer.\n\n      listeners = []\n\n      notify = (newValue) ->\n        listeners.forEach (listener) ->\n          listener(newValue)\n\nOur observable function is stored as a reference to `self`.\n\nIf `value` is a function compute dependencies and listen to observables that it depends on.\n\n      if typeof value is 'function'\n        fn = value\n        self = ->\n          # Automagic dependency observation\n          magicDependency(self)\n\n          return value\n\n        self.observe = (listener) ->\n          listeners.push listener\n\n        changed = ->\n          value = fn()\n          notify(value)\n\n        value = computeDependencies(fn, changed)\n\n      else\n\nWhen called with zero arguments it is treated as a getter. When called with one argument it is treated as a setter.\n\nChanges to the value will trigger notifications.\n\nThe value is always returned.\n\n        self = (newValue) ->\n          if arguments.length > 0\n            if value != newValue\n              value = newValue\n\n              notify(newValue)\n          else\n            # Automagic dependency observation\n            magicDependency(self)\n\n          return value\n\nAdd a listener for when this object changes.\n\n        self.observe = (listener) ->\n          listeners.push listener\n\nThis `each` iterator is similar to [the Maybe monad](http://en.wikipedia.org/wiki/Monad_&#40;functional_programming&#41;#The_Maybe_monad) in that our observable may contain a single value or nothing at all.\n\n      self.each = (args...) ->\n        if value?\n          [value].forEach(args...)\n\nIf the value is an array then proxy array methods and add notifications to mutation events.\n\n      if Array.isArray(value)\n        [\n          \"concat\"\n          \"every\"\n          \"filter\"\n          \"forEach\"\n          \"indexOf\"\n          \"join\"\n          \"lastIndexOf\"\n          \"map\"\n          \"reduce\"\n          \"reduceRight\"\n          \"slice\"\n          \"some\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            value[method](args...)\n\n        [\n          \"pop\"\n          \"push\"\n          \"reverse\"\n          \"shift\"\n          \"splice\"\n          \"sort\"\n          \"unshift\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            notifyReturning value[method](args...)\n\n        notifyReturning = (returnValue) ->\n          notify(value)\n\n          return returnValue\n\nAdd some extra helpful methods to array observables.\n\n        extend self,\n          each: (args...) ->\n            self.forEach(args...)\n\n            return self\n\nRemove an element from the array and notify observers of changes.\n\n          remove: (object) ->\n            index = value.indexOf(object)\n\n            if index >= 0\n              notifyReturning value.splice(index, 1)[0]\n\n          get: (index) ->\n            value[index]\n\n          first: ->\n            value[0]\n\n          last: ->\n            value[value.length-1]\n\n      self.stopObserving = (fn) ->\n        remove listeners, fn\n\n      return self\n\nExport `Observable`\n\n    module.exports = Observable\n\nAppendix\n--------\n\nThe extend method adds one objects properties to another.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nSuper hax for computing dependencies. This needs to be a shared global so that\ndifferent bundled versions of observable libraries can interoperate.\n\n    global.OBSERVABLE_ROOT_HACK = undefined\n\n    magicDependency = (self) ->\n      if base = global.OBSERVABLE_ROOT_HACK\n        self.observe base\n\n    withBase = (root, fn) ->\n      global.OBSERVABLE_ROOT_HACK = root\n      value = fn()\n      global.OBSERVABLE_ROOT_HACK = undefined\n\n      return value\n\n    base = ->\n      global.OBSERVABLE_ROOT_HACK\n\nAutomagically compute dependencies.\n\n    computeDependencies = (fn, root) ->\n      withBase root, ->\n        fn()\n\nRemove a value from an array.\n\n    remove = (array, value) ->\n      index = array.indexOf(value)\n\n      if index >= 0\n        array.splice(index, 1)[0]\n",
              "type": "blob"
            },
            "pixie.cson": {
              "path": "pixie.cson",
              "mode": "100644",
              "content": "version: \"0.1.1\"\n",
              "type": "blob"
            },
            "test/observable.coffee": {
              "path": "test/observable.coffee",
              "mode": "100644",
              "content": "Observable = require \"../main\"\n\ndescribe 'Observable', ->\n  it 'should create an observable for an object', ->\n    n = 5\n\n    observable = Observable(n)\n\n    assert.equal(observable(), n)\n\n  it 'should fire events when setting', ->\n    string = \"yolo\"\n\n    observable = Observable(string)\n    observable.observe (newValue) ->\n      assert.equal newValue, \"4life\"\n\n    observable(\"4life\")\n\n  it 'should be idempotent', ->\n    o = Observable(5)\n\n    assert.equal o, Observable(o)\n\n  describe \"#each\", ->\n    it \"should be invoked once if there is an observable\", ->\n      o = Observable(5)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n        assert.equal value, 5\n\n      assert.equal called, 1\n\n    it \"should not be invoked if observable is null\", ->\n      o = Observable(null)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n\n      assert.equal called, 0\n\n  it \"should allow for stopping observation\", ->\n    observable = Observable(\"string\")\n\n    called = 0\n    fn = (newValue) ->\n      called += 1\n      assert.equal newValue, \"4life\"\n\n    observable.observe fn\n\n    observable(\"4life\")\n\n    observable.stopObserving fn\n\n    observable(\"wat\")\n\n    assert.equal called, 1\n\ndescribe \"Observable Array\", ->\n  it \"should proxy array methods\", ->\n    o = Observable [5]\n\n    o.map (n) ->\n      assert.equal n, 5\n\n  it \"should notify on mutation methods\", (done) ->\n    o = Observable []\n\n    o.observe (newValue) ->\n      assert.equal newValue[0], 1\n\n    o.push 1\n\n    done()\n\n  it \"should have an each method\", ->\n    o = Observable []\n\n    assert o.each\n\n  it \"#get\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.get(2), 2\n\n  it \"#first\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.first(), 0\n\n  it \"#last\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.last(), 3\n\n  it \"#remove\", (done) ->\n    o = Observable [0, 1, 2, 3]\n\n    o.observe (newValue) ->\n      assert.equal newValue.length, 3\n      setTimeout ->\n        done()\n      , 0\n\n    assert.equal o.remove(2), 2\n\n  # TODO: This looks like it might be impossible\n  it \"should proxy the length property\"\n\ndescribe \"Observable functions\", ->\n  it \"should compute dependencies\", (done) ->\n    firstName = Observable \"Duder\"\n    lastName = Observable \"Man\"\n\n    o = Observable ->\n      \"#{firstName()} #{lastName()}\"\n\n    o.observe (newValue) ->\n      assert.equal newValue, \"Duder Bro\"\n\n      done()\n\n    lastName \"Bro\"\n\n  it \"should allow double nesting\", (done) ->\n    bottom = Observable \"rad\"\n    middle = Observable ->\n      bottom()\n    top = Observable ->\n      middle()\n\n    top.observe (newValue) ->\n      assert.equal newValue, \"wat\"\n      assert.equal top(), newValue\n      assert.equal middle(), newValue\n\n      done()\n\n    bottom(\"wat\")\n\n  it \"should have an each method\", ->\n    o = Observable ->\n\n    assert o.each\n\n  it \"should not invoke when returning undefined\", ->\n    o = Observable ->\n\n    o.each ->\n      assert false\n\n  it \"should invoke when returning any defined value\", (done) ->\n    o = Observable -> 5\n\n    o.each (n) ->\n      assert.equal n, 5\n      done()\n\n  it \"should work on an array dependency\", ->\n    oA = Observable [1, 2, 3]\n\n    o = Observable ->\n      oA()[0]\n\n    last = Observable ->\n      oA()[oA().length-1]\n\n    assert.equal o(), 1\n\n    oA.unshift 0\n\n    assert.equal o(), 0\n\n    oA.push 4\n\n    assert.equal last(), 4, \"Last should be 4\"\n",
              "type": "blob"
            }
          },
          "distribution": {
            "main": {
              "path": "main",
              "content": "(function() {\n  var Observable, base, computeDependencies, extend, magicDependency, remove, withBase,\n    __slice = [].slice;\n\n  Observable = function(value) {\n    var changed, fn, listeners, notify, notifyReturning, self;\n    if (typeof (value != null ? value.observe : void 0) === \"function\") {\n      return value;\n    }\n    listeners = [];\n    notify = function(newValue) {\n      return listeners.forEach(function(listener) {\n        return listener(newValue);\n      });\n    };\n    if (typeof value === 'function') {\n      fn = value;\n      self = function() {\n        magicDependency(self);\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n      changed = function() {\n        value = fn();\n        return notify(value);\n      };\n      value = computeDependencies(fn, changed);\n    } else {\n      self = function(newValue) {\n        if (arguments.length > 0) {\n          if (value !== newValue) {\n            value = newValue;\n            notify(newValue);\n          }\n        } else {\n          magicDependency(self);\n        }\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n    }\n    self.each = function() {\n      var args, _ref;\n      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      if (value != null) {\n        return (_ref = [value]).forEach.apply(_ref, args);\n      }\n    };\n    if (Array.isArray(value)) {\n      [\"concat\", \"every\", \"filter\", \"forEach\", \"indexOf\", \"join\", \"lastIndexOf\", \"map\", \"reduce\", \"reduceRight\", \"slice\", \"some\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return value[method].apply(value, args);\n        };\n      });\n      [\"pop\", \"push\", \"reverse\", \"shift\", \"splice\", \"sort\", \"unshift\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return notifyReturning(value[method].apply(value, args));\n        };\n      });\n      notifyReturning = function(returnValue) {\n        notify(value);\n        return returnValue;\n      };\n      extend(self, {\n        each: function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          self.forEach.apply(self, args);\n          return self;\n        },\n        remove: function(object) {\n          var index;\n          index = value.indexOf(object);\n          if (index >= 0) {\n            return notifyReturning(value.splice(index, 1)[0]);\n          }\n        },\n        get: function(index) {\n          return value[index];\n        },\n        first: function() {\n          return value[0];\n        },\n        last: function() {\n          return value[value.length - 1];\n        }\n      });\n    }\n    self.stopObserving = function(fn) {\n      return remove(listeners, fn);\n    };\n    return self;\n  };\n\n  module.exports = Observable;\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  global.OBSERVABLE_ROOT_HACK = void 0;\n\n  magicDependency = function(self) {\n    var base;\n    if (base = global.OBSERVABLE_ROOT_HACK) {\n      return self.observe(base);\n    }\n  };\n\n  withBase = function(root, fn) {\n    var value;\n    global.OBSERVABLE_ROOT_HACK = root;\n    value = fn();\n    global.OBSERVABLE_ROOT_HACK = void 0;\n    return value;\n  };\n\n  base = function() {\n    return global.OBSERVABLE_ROOT_HACK;\n  };\n\n  computeDependencies = function(fn, root) {\n    return withBase(root, function() {\n      return fn();\n    });\n  };\n\n  remove = function(array, value) {\n    var index;\n    index = array.indexOf(value);\n    if (index >= 0) {\n      return array.splice(index, 1)[0];\n    }\n  };\n\n}).call(this);\n",
              "type": "blob"
            },
            "pixie": {
              "path": "pixie",
              "content": "module.exports = {\"version\":\"0.1.1\"};",
              "type": "blob"
            },
            "test/observable": {
              "path": "test/observable",
              "content": "(function() {\n  var Observable;\n\n  Observable = require(\"../main\");\n\n  describe('Observable', function() {\n    it('should create an observable for an object', function() {\n      var n, observable;\n      n = 5;\n      observable = Observable(n);\n      return assert.equal(observable(), n);\n    });\n    it('should fire events when setting', function() {\n      var observable, string;\n      string = \"yolo\";\n      observable = Observable(string);\n      observable.observe(function(newValue) {\n        return assert.equal(newValue, \"4life\");\n      });\n      return observable(\"4life\");\n    });\n    it('should be idempotent', function() {\n      var o;\n      o = Observable(5);\n      return assert.equal(o, Observable(o));\n    });\n    describe(\"#each\", function() {\n      it(\"should be invoked once if there is an observable\", function() {\n        var called, o;\n        o = Observable(5);\n        called = 0;\n        o.each(function(value) {\n          called += 1;\n          return assert.equal(value, 5);\n        });\n        return assert.equal(called, 1);\n      });\n      return it(\"should not be invoked if observable is null\", function() {\n        var called, o;\n        o = Observable(null);\n        called = 0;\n        o.each(function(value) {\n          return called += 1;\n        });\n        return assert.equal(called, 0);\n      });\n    });\n    return it(\"should allow for stopping observation\", function() {\n      var called, fn, observable;\n      observable = Observable(\"string\");\n      called = 0;\n      fn = function(newValue) {\n        called += 1;\n        return assert.equal(newValue, \"4life\");\n      };\n      observable.observe(fn);\n      observable(\"4life\");\n      observable.stopObserving(fn);\n      observable(\"wat\");\n      return assert.equal(called, 1);\n    });\n  });\n\n  describe(\"Observable Array\", function() {\n    it(\"should proxy array methods\", function() {\n      var o;\n      o = Observable([5]);\n      return o.map(function(n) {\n        return assert.equal(n, 5);\n      });\n    });\n    it(\"should notify on mutation methods\", function(done) {\n      var o;\n      o = Observable([]);\n      o.observe(function(newValue) {\n        return assert.equal(newValue[0], 1);\n      });\n      o.push(1);\n      return done();\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable([]);\n      return assert(o.each);\n    });\n    it(\"#get\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.get(2), 2);\n    });\n    it(\"#first\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.first(), 0);\n    });\n    it(\"#last\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.last(), 3);\n    });\n    it(\"#remove\", function(done) {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      o.observe(function(newValue) {\n        assert.equal(newValue.length, 3);\n        return setTimeout(function() {\n          return done();\n        }, 0);\n      });\n      return assert.equal(o.remove(2), 2);\n    });\n    return it(\"should proxy the length property\");\n  });\n\n  describe(\"Observable functions\", function() {\n    it(\"should compute dependencies\", function(done) {\n      var firstName, lastName, o;\n      firstName = Observable(\"Duder\");\n      lastName = Observable(\"Man\");\n      o = Observable(function() {\n        return \"\" + (firstName()) + \" \" + (lastName());\n      });\n      o.observe(function(newValue) {\n        assert.equal(newValue, \"Duder Bro\");\n        return done();\n      });\n      return lastName(\"Bro\");\n    });\n    it(\"should allow double nesting\", function(done) {\n      var bottom, middle, top;\n      bottom = Observable(\"rad\");\n      middle = Observable(function() {\n        return bottom();\n      });\n      top = Observable(function() {\n        return middle();\n      });\n      top.observe(function(newValue) {\n        assert.equal(newValue, \"wat\");\n        assert.equal(top(), newValue);\n        assert.equal(middle(), newValue);\n        return done();\n      });\n      return bottom(\"wat\");\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable(function() {});\n      return assert(o.each);\n    });\n    it(\"should not invoke when returning undefined\", function() {\n      var o;\n      o = Observable(function() {});\n      return o.each(function() {\n        return assert(false);\n      });\n    });\n    it(\"should invoke when returning any defined value\", function(done) {\n      var o;\n      o = Observable(function() {\n        return 5;\n      });\n      return o.each(function(n) {\n        assert.equal(n, 5);\n        return done();\n      });\n    });\n    return it(\"should work on an array dependency\", function() {\n      var last, o, oA;\n      oA = Observable([1, 2, 3]);\n      o = Observable(function() {\n        return oA()[0];\n      });\n      last = Observable(function() {\n        return oA()[oA().length - 1];\n      });\n      assert.equal(o(), 1);\n      oA.unshift(0);\n      assert.equal(o(), 0);\n      oA.push(4);\n      return assert.equal(last(), 4, \"Last should be 4\");\n    });\n  });\n\n}).call(this);\n",
              "type": "blob"
            }
          },
          "progenitor": {
            "url": "http://strd6.github.io/editor/"
          },
          "version": "0.1.1",
          "entryPoint": "main",
          "repository": {
            "id": 17119562,
            "name": "observable",
            "full_name": "distri/observable",
            "owner": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
              "gravatar_id": "192f3f168409e79c42107f081139d9f3",
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "private": false,
            "html_url": "https://github.com/distri/observable",
            "description": "",
            "fork": false,
            "url": "https://api.github.com/repos/distri/observable",
            "forks_url": "https://api.github.com/repos/distri/observable/forks",
            "keys_url": "https://api.github.com/repos/distri/observable/keys{/key_id}",
            "collaborators_url": "https://api.github.com/repos/distri/observable/collaborators{/collaborator}",
            "teams_url": "https://api.github.com/repos/distri/observable/teams",
            "hooks_url": "https://api.github.com/repos/distri/observable/hooks",
            "issue_events_url": "https://api.github.com/repos/distri/observable/issues/events{/number}",
            "events_url": "https://api.github.com/repos/distri/observable/events",
            "assignees_url": "https://api.github.com/repos/distri/observable/assignees{/user}",
            "branches_url": "https://api.github.com/repos/distri/observable/branches{/branch}",
            "tags_url": "https://api.github.com/repos/distri/observable/tags",
            "blobs_url": "https://api.github.com/repos/distri/observable/git/blobs{/sha}",
            "git_tags_url": "https://api.github.com/repos/distri/observable/git/tags{/sha}",
            "git_refs_url": "https://api.github.com/repos/distri/observable/git/refs{/sha}",
            "trees_url": "https://api.github.com/repos/distri/observable/git/trees{/sha}",
            "statuses_url": "https://api.github.com/repos/distri/observable/statuses/{sha}",
            "languages_url": "https://api.github.com/repos/distri/observable/languages",
            "stargazers_url": "https://api.github.com/repos/distri/observable/stargazers",
            "contributors_url": "https://api.github.com/repos/distri/observable/contributors",
            "subscribers_url": "https://api.github.com/repos/distri/observable/subscribers",
            "subscription_url": "https://api.github.com/repos/distri/observable/subscription",
            "commits_url": "https://api.github.com/repos/distri/observable/commits{/sha}",
            "git_commits_url": "https://api.github.com/repos/distri/observable/git/commits{/sha}",
            "comments_url": "https://api.github.com/repos/distri/observable/comments{/number}",
            "issue_comment_url": "https://api.github.com/repos/distri/observable/issues/comments/{number}",
            "contents_url": "https://api.github.com/repos/distri/observable/contents/{+path}",
            "compare_url": "https://api.github.com/repos/distri/observable/compare/{base}...{head}",
            "merges_url": "https://api.github.com/repos/distri/observable/merges",
            "archive_url": "https://api.github.com/repos/distri/observable/{archive_format}{/ref}",
            "downloads_url": "https://api.github.com/repos/distri/observable/downloads",
            "issues_url": "https://api.github.com/repos/distri/observable/issues{/number}",
            "pulls_url": "https://api.github.com/repos/distri/observable/pulls{/number}",
            "milestones_url": "https://api.github.com/repos/distri/observable/milestones{/number}",
            "notifications_url": "https://api.github.com/repos/distri/observable/notifications{?since,all,participating}",
            "labels_url": "https://api.github.com/repos/distri/observable/labels{/name}",
            "releases_url": "https://api.github.com/repos/distri/observable/releases{/id}",
            "created_at": "2014-02-23T23:17:52Z",
            "updated_at": "2014-04-02T00:41:29Z",
            "pushed_at": "2014-04-02T00:41:31Z",
            "git_url": "git://github.com/distri/observable.git",
            "ssh_url": "git@github.com:distri/observable.git",
            "clone_url": "https://github.com/distri/observable.git",
            "svn_url": "https://github.com/distri/observable",
            "homepage": null,
            "size": 164,
            "stargazers_count": 0,
            "watchers_count": 0,
            "language": "CoffeeScript",
            "has_issues": true,
            "has_downloads": true,
            "has_wiki": true,
            "forks_count": 0,
            "mirror_url": null,
            "open_issues_count": 0,
            "forks": 0,
            "open_issues": 0,
            "watchers": 0,
            "default_branch": "master",
            "master_branch": "master",
            "permissions": {
              "admin": true,
              "push": true,
              "pull": true
            },
            "organization": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
              "gravatar_id": "192f3f168409e79c42107f081139d9f3",
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "network_count": 0,
            "subscribers_count": 2,
            "branch": "v0.1.1",
            "publishBranch": "gh-pages"
          },
          "dependencies": {}
        }
      }
    }
  }
});