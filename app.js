var app = {
  apiKey: '', // you get this from ~~SOE~~ daybreak?
  data: {},
  $title: $('.title'),
  $outputHeader: $('.kills h1'),
  $outputList: $('.kills ul'),
  $deathsHeader: $('.deaths h1'),
  $deathsList: $('.deaths ul'),
  $input: $('input'),
  $note: $('.note'),
  outfit: false,
  localFaction: 0,
  tkcount: 0,
  killCount: 0,
  suicideCount: 0,

  apis: {
    characterId: function (name) {
      var url = "http://census.soe.com/" + app.apiKey + "/get/ps2:v2/character/?name.first_lower=" + name + "&c:resolve=online_status&callback=?";
      return url;
    },
    killsByCharacters: function (chars) {
      var url = "http://census.soe.com/" + app.apiKey + "/get/ps2:v2/characters_event/?character_id=" + chars + "&c:limit=1000&type=KILL&c:resolve=attacker,character&callback=?";
      return url;
    },
    deathsByCharacters: function (chars) {
      var url = "http://census.soe.com/" + app.apiKey + "/get/ps2:v2/characters_event/?character_id=" + chars + "&c:limit=1000&type=DEATH&c:resolve=attacker,character&callback=?";
      return url;
    },
    outfitCharacters: function (outfit) {
      outfit = outfit.split("[")[1].split("]")[0];
      var url = "http://census.soe.com/" + app.apiKey + "/get/ps2:v2/outfit?alias_lower=" + outfit + "&c:resolve=member_character,member_faction&callback=?";
      return url;
    }
  },

  factionMap: ["empty", "vanu", "freedom", "terran"],

  titleMap: {
    "0": "A mostly pristine record...",
    "5": "Blame the meatshields!",
    "10": "Stop jumping in front of this guy's gun!",
    "15": "What color are our uniforms, again?",
    "20": "You might want to re-think your faction.",
    "25": "A player of questionable character.",
    "30": "This one lives under a bridge.",
    "35": "A true sandbag.",
    "40": "The reason you lost that fight.",
    "45": "Just another useless alt.",
    "50": "Shitlord territory.",
    "55": "Basement dweller.",
    "60": "A discredit to team.",
    "75": "THREE QUARTERS OF THIS PERSON'S KILLS ARE TEAMMATES!",
    "80": "Ban this fool, please?",
    "85": "WHERE IS THE BANHAMMER?",
    "90": "A reason this widget was created...",
    "95": "Tweet this link <a href='http://twitter.com/mhigby'>@mhigby</a>, stat!",
    "100": "Special case, here."
  },

  worlds: {
    "1": "Connery",
    "9": "Woodman",
    "10": "Miller",
    "11": "Ceres",
    "13": "Cobalt",
    "17": "Emerald",
    "25": "Briggs"
  },

  zones: {
    "2": "sweating it out on <strong>Indar</strong>.",
    "4": "slogging through <strong>Hossin</strong>.",
    "6": "enjoying <strong>Amerish</strong>.",
    "8": "chilling on <strong>Esamir</strong>.",
    "96": "practicing in <strong>VR Training</strong>."
  },

  init: function () {
    this.setUpBinds();
    $("#character-name").focus();
  },

  setUpBinds: function () {
    app.$input.on("keypress", function (e) {
      var which = e.which;
      if (which === 13) {
        app.$input.attr("placeholder", "Working...");
        var val = $(this).val();
        app.getPage(val);
      }
    });

    $(".output ul").on("mouseenter", "[who]", function () {
      var who = $(this).attr("who");
      $("[who='" + who + "']").addClass("highlight");
    });


    $(".output").on("mouseleave", "[who]", function () {
      $(".highlight").removeClass("highlight");
    });

    $(".output").on("click", "a", function (e) {
      e.preventDefault();
      app.getPage($(this).attr("href").split("#")[1]);
    });
  },

  startLoading: function () {
    app.$outputList.html($("<div />", {
      "class": "loading"
    }));
  },

  getPage: function (val) {
    location.hash = val;
    location.reload();
  },

  addKillData: function (realname, kills, turtle) {

    if (app.data.firstKill && app.data.isOnline){
      app.data.firstKill = false;
      app.$note.append("<br />They were last seen " + app.zones[kills[0].zone_id]);
    }

    $(".loading").remove();
    if (kills.length === 0){
      app.$outputHeader.html("That player doesn't exist.");
      $(".loading").remove();
      return;
    }

    var i = 0;
    var faction = "0";
    var tkcount = (app.outfit) ? app.tkcount : 0;
    var suicideCount = (app.outfit) ? app.suicideCount : 0;
    var chardata;
    var attackername;
    var $el;
    var defenderName;
    var timestamp;
    var date;
    var $list = [];
    var killCount = (app.outfit) ? app.killCount += kills.length : kills.length;
    app.classmod = app.factionMap[parseInt(app.localFaction)];

    for (i; i < kills.length; i++) {
      if (kills[i].hasOwnProperty("character") && kills[i].hasOwnProperty("attacker")) {
        attackerName = kills[i].attacker.name.first;
        chardata = kills[i].character;
        defenderName = chardata.name.first;
        faction = (turtle) ? kills[i].attacker.faction_id : kills[i].character.faction_id;
        timestamp = parseInt(kills[i].timestamp) * 1000
        date = new Date(timestamp);
        date = date.format("mmmm dd - h:MMt");

        var link = (turtle) ? attackerName : defenderName;
       
        if (app.localFaction === faction) {
          if (attackerName !== defenderName) {
            $el = $("<li />", {
              "html": '<a when="' + timestamp + '" who="'+link+'" class="' + app.classmod + ' ' + defenderName + '" href="/#' + link + '">' + attackerName + ' <i class="fa fa-long-arrow-right"></i> ' + defenderName + '</a><div class="timestamp float-right">' + date + '</div>'
            });
            tkcount++;
            $list.push($el);
          } else {
            killCount--;
            suicideCount++;
          }
        }
      }
    }

    if (app.outfit) {
      app.suicideCount = suicideCount;
      app.tkcount = tkcount;
      app.killCount = killCount;
    }

    var percentage = ((tkcount / killCount) * 100).toFixed(2);
    if (turtle){
      app.$deathsHeader.html("<span class='" + app.classmod + "'>" + realname + "</span> has been team-killed<br class='desktop'/> <span>" + percentage + "%</span> of their last <span>" + killCount + "</span> deaths.");
      app.$input.attr("placeholder", realname);
      app.$deathsList.append($list).attr("data-tks");
    } else {
      app.$outputHeader.html("<span class='" + app.classmod + "'>" + realname + "</span> has killed a teammate<br class='desktop'/> <span>" + percentage + "%</span> of their last <span>" + killCount + "</span> kills<br class='desktop' /> while accumulating <span>" + suicideCount + "</span> suicide(s).");
      app.$input.attr("placeholder", realname);
      app.$outputList.append($list);
      
      var titleAmount = parseInt(percentage) - (parseInt(percentage) % 5);
      setTimeout(function(){
        app.$title.html(app.titleMap[titleAmount]).slideDown();
      }, 1500);
    }

  },

  getByCharacter: function (name) {
    app.startLoading();
    var api = app.apis.characterId(name);
    var realname;
    $.getJSON(api, function (data) {
      if (!data.character_list[0]) {
        app.$note.html("Name doesn't exist").slideDown();
      } else {
        var character = data.character_list[0];
        app.$input.val("");
        var id = character.character_id;
        var online = parseInt(character.online_status);
        realname = character.name.first;
        app.localFaction = character.faction_id;
        if (online && !app.outfit){
          var world = app.worlds[online];
          app.data.isOnline = true;
          app.$note.addClass("text-center italic normal").html("<strong>" + realname + "</strong> is on <strong>" + world + "</strong> right now!").slideDown();
        }
        $.getJSON(app.apis.killsByCharacters(id), function (data) {
          var kills = data.characters_event_list;
          app.data.firstKill = true;
          app.addKillData(realname, kills, false);
        });
        $.getJSON(app.apis.deathsByCharacters(id), function (data) {
          var deaths = data.characters_event_list;
          app.addKillData(realname, deaths, true);
        });
      }
    });
  },

  getByOutfit: function (tag) {
    app.outfit = true;
    app.startLoading();
    $(".kills").removeClass("col-1-2");
    var api = app.apis.outfitCharacters(tag.toLowerCase());
    var members;
    var charids = [];
    var tag;
    $.getJSON(api, function (data) {
      if (!data.outfit_list[0]) {
        app.$outputHeader.html("Outfit '" + tag + "' doesn't exist.");
      } else {
        app.outfitTag = data.outfit_list[0].alias;
        members = data.outfit_list[0].members;
        app.membersLength = members.length;
        app.localFaction = members[0].faction_id;
        var which = 0;
        while (members[which].faction_id === undefined){
          which++;
        }
        app.localFaction = members[which].faction_id;
        for (x = 0; x < members.length; x++){
          charids.push(members[x].character_id);
        }
        app.buildOutfitChunks(charids);
      }
    });
  },

  buildOutfitChunks: function (list) {
    var chunks = [];
    var delay = 1500;
    var timeout = 0;
    var waittime = 0;
    var chunktemp = [];
    for (var x = 0; x < list.length; x++){ 
      chunktemp.push(list[x]);
      if (x % 10 === 0){
        chunks.push(chunktemp.join(","));
        chunktemp = [];
      }
    }
    waittime = (delay*chunks.length)/1000;
    app.$note.slideDown();
    app.$note.html("<div class='waittime'>This will take approximately " + waittime + " seconds to complete... ");
    app.$note.append( $("<div />",{
      "class": "progress",
      "attr-tick": (100 / (app.membersLength/10) - 1),
      "html": "<div class='inner'></div>"
    }));
    setTimeout( function(){
      app.$note.slideUp();
    }, (waittime*1000) + 2500);
    chunks.push(chunktemp.join(","));

    for (var x = 0; x < chunks.length; x++){
      var api = app.apis.killsByCharacters(chunks[x]);
      timeout = delay * x;
      app.chunkTimer(api, timeout);
    }
  },

  chunkTimer: function(api, timeout){
    setTimeout( function(){
      $.getJSON(api, function (data) {
        var kills = data.characters_event_list;
        app.addKillData("["+app.outfitTag+"]", kills);
        var tick = parseInt($(".progress").attr("attr-tick"));
        var innerw = parseInt($(".progress .inner")[0].style.width) || 0;
        var newWidth = innerw + tick + "%";
        if (parseInt(newWidth) > 100) newWidth = 100+"%";
        $(".progress .inner").css({
          "width": newWidth
        })
      });
    }, timeout);
  }
};

$(document).ready(function () {
  app.init();
  var hash = document.location.hash.split("#")[1];
  var x = new RegExp(/(\[)[[A-z0-9]{1,4}?(\])/g);

  if (hash) {
    var outfit = hash.match(x);

    if(!outfit){
      app.outfit = false;
      app.getByCharacter(hash.toLowerCase());
    } else {
      app.outfit = true;
      app.getByOutfit(hash);
    }
  } else {
    app.getByCharacter("higby");
  }
});

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

 var dateFormat = function () {
  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
  timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
  timezoneClip = /[^-+\dA-Z]/g,
  pad = function (val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) val = "0" + val;
    return val;
  };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
      var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
          mask = date;
          date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
          mask = mask.slice(4);
          utc = true;
        }

        var _ = utc ? "getUTC" : "get",
        d = date[_ + "Date"](),
        D = date[_ + "Day"](),
        m = date[_ + "Month"](),
        y = date[_ + "FullYear"](),
        H = date[_ + "Hours"](),
        M = date[_ + "Minutes"](),
        s = date[_ + "Seconds"](),
        L = date[_ + "Milliseconds"](),
        o = utc ? 0 : date.getTimezoneOffset(),
        flags = {
          d:    d,
          dd:   pad(d),
          ddd:  dF.i18n.dayNames[D],
          dddd: dF.i18n.dayNames[D + 7],
          m:    m + 1,
          mm:   pad(m + 1),
          mmm:  dF.i18n.monthNames[m],
          mmmm: dF.i18n.monthNames[m + 12],
          yy:   String(y).slice(2),
          yyyy: y,
          h:    H % 12 || 12,
          hh:   pad(H % 12 || 12),
          H:    H,
          HH:   pad(H),
          M:    M,
          MM:   pad(M),
          s:    s,
          ss:   pad(s),
          l:    pad(L, 3),
          L:    pad(L > 99 ? Math.round(L / 10) : L),
          t:    H < 12 ? "a"  : "p",
          tt:   H < 12 ? "am" : "pm",
          T:    H < 12 ? "A"  : "P",
          TT:   H < 12 ? "AM" : "PM",
          Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
          o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
        };

        return mask.replace(token, function ($0) {
          return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
      };
    }();

// Some common format strings
dateFormat.masks = {
  "default":      "ddd mmm dd yyyy HH:MM:ss",
  shortDate:      "m/d/yy",
  mediumDate:     "mmm d, yyyy",
  longDate:       "mmmm d, yyyy",
  fullDate:       "dddd, mmmm d, yyyy",
  shortTime:      "h:MM TT",
  mediumTime:     "h:MM:ss TT",
  longTime:       "h:MM:ss TT Z",
  isoDate:        "yyyy-mm-dd",
  isoTime:        "HH:MM:ss",
  isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
  dayNames: [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ],
  monthNames: [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
  return dateFormat(this, mask, utc);
};


(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-52755749-1', 'auto');
var pageData = {
  'hitType' : 'pageview',
  'page' : '/' + location.hash,
  'title': 'Planetside 2 Team Kill Tracker'
} 
ga('send', pageData);
