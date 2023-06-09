/*! Ajax Autocomplete for jQuery */
!(function (t) {
  "use strict";
  "function" == typeof define && define.amd
    ? define(["jquery"], t)
    : "object" == typeof exports && "function" == typeof require
    ? t(require("jquery"))
    : t(jQuery);
})(function (t) {
  "use strict";
  var e = {
      escapeRegExChars: function (t) {
        return t.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      },
      createNode: function (t) {
        var e = document.createElement("div");
        return (
          (e.className = t),
          (e.style.position = "absolute"),
          (e.style.display = "none"),
          e
        );
      },
    },
    s = 27,
    i = 9,
    n = 13,
    o = 38,
    l = 39,
    a = 40;
  function r(e, s) {
    var i = function () {},
      n = {
        ajaxSettings: {},
        autoSelectFirst: !1,
        appendTo: document.body,
        serviceUrl: null,
        lookup: null,
        onSelect: null,
        width: "auto",
        minChars: 1,
        maxHeight: 300,
        deferRequestBy: 0,
        params: {},
        formatResult: r.formatResult,
        delimiter: null,
        zIndex: 9999,
        type: "GET",
        noCache: !1,
        onSearchStart: i,
        onSearchComplete: i,
        onSearchError: i,
        preserveInput: !1,
        containerClass: "#autocomplete-suggestions",
        tabDisabled: !1,
        dataType: "text",
        currentRequest: null,
        triggerSelectOnValidInput: !0,
        preventBadQueries: !0,
        lookupFilter: function (t, e, s) {
          return -1 !== t.value.toLowerCase().indexOf(s);
        },
        paramName: "query",
        transformResult: function (e) {
          return "string" == typeof e ? t.parseJSON(e) : e;
        },
        showNoSuggestionNotice: !1,
        noSuggestionNotice: "No results",
        orientation: "bottom",
        forceFixPosition: !1,
      };
    (this.element = e),
      (this.el = t(e)),
      (this.suggestions = []),
      (this.badQueries = []),
      (this.selectedIndex = -1),
      (this.currentValue = this.element.value),
      (this.intervalId = 0),
      (this.cachedResponse = {}),
      (this.onChangeInterval = null),
      (this.onChange = null),
      (this.isLocal = !1),
      (this.suggestionsContainer = null),
      (this.noSuggestionsContainer = null),
      (this.options = t.extend({}, n, s)),
      (this.classes = {
        selected: "autocomplete-selected",
        suggestion: "autocomplete-suggestion",
      }),
      (this.hint = null),
      (this.hintValue = ""),
      (this.selection = null),
      this.initialize(),
      this.setOptions(s);
  }
  (r.utils = e),
    (t.Autocomplete = r),
    (r.formatResult = function (t, s) {
      if (!s) return t.value;
      var i = "(" + e.escapeRegExChars(s) + ")";
      return t.value
        .replace(new RegExp(i, "gi"), "<strong>$1</strong>")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/&lt;(\/?strong)&gt;/g, "<$1>");
    }),
    (r.prototype = {
      killerFn: null,
      initialize: function () {
        var e,
          s = this,
          i = "." + s.classes.suggestion,
          n = s.classes.selected,
          o = s.options;
        s.element.setAttribute("autocomplete", "off"),
          (s.killerFn = function (e) {
            0 === t(e.target).closest(s.options.containerClass).length &&
              (s.killSuggestions(), s.disableKillerFn());
          }),
          (s.noSuggestionsContainer = t(
            '<div class="autocomplete-no-suggestion"></div>'
          )
            .html(this.options.noSuggestionNotice)
            .get(0)),
          (s.suggestionsContainer = t(o.containerClass)),
          (e = s.suggestionsContainer).on(
            "mouseover.autocomplete",
            i,
            function () {
              s.activate(t(this).data("index"));
            }
          ),
          e.on("mouseout.autocomplete", function () {
            (s.selectedIndex = -1), e.children("." + n).removeClass(n);
          }),
          e.on("click.autocomplete", i, function () {
            s.select(t(this).data("index"));
          }),
          (s.fixPositionCapture = function () {
            s.visible && s.fixPosition();
          }),
          t(window).on("resize.autocomplete", s.fixPositionCapture),
          s.el.on("keydown.autocomplete", function (t) {
            s.onKeyPress(t);
          }),
          s.el.on("keyup.autocomplete", function (t) {
            s.onKeyUp(t);
          }),
          s.el.on("blur.autocomplete", function () {
            s.onBlur();
          }),
          s.el.on("focus.autocomplete", function () {
            s.onFocus();
          }),
          s.el.on("change.autocomplete", function (t) {
            s.onKeyUp(t);
          }),
          s.el.on("input.autocomplete", function (t) {
            s.onKeyUp(t);
          });
      },
      onFocus: function () {
        this.fixPosition(),
          this.el.val().length >= this.options.minChars && this.onValueChange();
      },
      onBlur: function () {
        this.enableKillerFn();
      },
      abortAjax: function () {
        this.currentRequest &&
          (this.currentRequest.abort(), (this.currentRequest = null));
      },
      setOptions: function (e) {
        var s = this.options;
        t.extend(s, e),
          (this.isLocal = t.isArray(s.lookup)),
          this.isLocal && (s.lookup = this.verifySuggestionsFormat(s.lookup)),
          (s.orientation = this.validateOrientation(s.orientation, "bottom"));
      },
      clearCache: function () {
        (this.cachedResponse = {}), (this.badQueries = []);
      },
      clear: function () {
        this.clearCache(), (this.currentValue = ""), (this.suggestions = []);
      },
      disable: function () {
        (this.disabled = !0),
          clearInterval(this.onChangeInterval),
          this.abortAjax();
      },
      enable: function () {
        this.disabled = !1;
      },
      fixPosition: function () {
        var e = this.suggestionsContainer,
          s = e.parent().get(0);
        if (s === document.body || this.options.forceFixPosition) {
          var i = this.options.orientation,
            n = e.outerHeight(),
            o = this.el.outerHeight(),
            l = this.el.offset();
          if (this.el.closest(".pop-up-live-search").length > 0) {
            var a = this.el.closest(".pop-up-live-search").outerWidth(),
              r = jQuery(".tie-popup-search-wrap").offset();
            (h = { top: l.top - r.top, left: l.left }).maxWidth = a + "px";
          } else if (this.el.closest(".tie-alignleft").length > 0) {
            if (is_RTL)
              var u = Math.floor(
                l.left + this.el.outerWidth() - this.options.width + 1
              );
            else u = Math.floor(l.left - 1);
            var h = { top: l.top, left: u };
          } else {
            if (is_RTL) u = Math.floor(l.left - 1);
            else
              u = Math.floor(
                l.left + this.el.outerWidth() - this.options.width + 1
              );
            h = { top: l.top, left: u };
          }
          var c = this.el.closest(".live-search-parent").data("skin");
          if (
            ("search-in-main-nav" == c
              ? jQuery("#theme-header").hasClass("main-nav-dark")
                ? (c += " live-search-dark")
                : (c += " live-search-light")
              : "search-in-top-nav" == c &&
                (jQuery("#theme-header").hasClass("top-nav-dark")
                  ? (c += " live-search-dark")
                  : (c += " live-search-light")),
            e.attr("class", c),
            "auto" === i)
          ) {
            var g = t(window).height(),
              d = t(window).scrollTop(),
              p = -d + l.top - n,
              f = d + g - (l.top + o + n);
            i = Math.max(p, f) === p ? "top" : "bottom";
          }
          if (((h.top += "top" === i ? -n : o), s !== document.body)) {
            var v,
              m = e.css("opacity");
            this.visible || e.css("opacity", 0).show(),
              (v = e.offsetParent().offset()),
              (h.top -= v.top),
              (h.left -= v.left),
              this.visible || e.css("opacity", m).hide();
          }
          e.css(h);
        }
      },
      enableKillerFn: function () {
        t(document).on("click.autocomplete", this.killerFn);
      },
      disableKillerFn: function () {
        t(document).off("click.autocomplete", this.killerFn);
      },
      killSuggestions: function () {
        var t = this;
        t.stopKillSuggestions(),
          (t.intervalId = window.setInterval(function () {
            t.visible && (t.el.val(t.currentValue), t.hide()),
              t.stopKillSuggestions();
          }, 50));
      },
      stopKillSuggestions: function () {
        window.clearInterval(this.intervalId);
      },
      isCursorAtEnd: function () {
        var t,
          e = this.el.val().length,
          s = this.element.selectionStart;
        return "number" == typeof s
          ? s === e
          : !document.selection ||
              ((t = document.selection.createRange()).moveStart(
                "character",
                -e
              ),
              e === t.text.length);
      },
      onKeyPress: function (t) {
        if (
          this.disabled ||
          this.visible ||
          t.which !== a ||
          !this.currentValue
        ) {
          if (!this.disabled && this.visible) {
            switch (t.which) {
              case s:
                this.el.val(this.currentValue), this.hide();
                break;
              case l:
                if (this.hint && this.options.onHint && this.isCursorAtEnd()) {
                  this.selectHint();
                  break;
                }
                return;
              case i:
                if (this.hint && this.options.onHint)
                  return void this.selectHint();
                if (-1 === this.selectedIndex) return void this.hide();
                if (
                  (this.select(this.selectedIndex),
                  !1 === this.options.tabDisabled)
                )
                  return;
                break;
              case n:
                if (-1 === this.selectedIndex) return void this.hide();
                this.select(this.selectedIndex);
                break;
              case o:
                this.moveUp();
                break;
              case a:
                this.moveDown();
                break;
              default:
                return;
            }
            t.stopImmediatePropagation(), t.preventDefault();
          }
        } else this.suggest();
      },
      onKeyUp: function (t) {
        var e = this;
        if (!e.disabled) {
          switch (t.which) {
            case o:
            case a:
              return;
          }
          clearInterval(e.onChangeInterval),
            e.currentValue !== e.el.val() &&
              (e.findBestHint(),
              e.options.deferRequestBy > 0
                ? (e.onChangeInterval = setInterval(function () {
                    e.onValueChange();
                  }, e.options.deferRequestBy))
                : e.onValueChange());
        }
      },
      onValueChange: function () {
        var e = this.options,
          s = this.el.val(),
          i = this.getQuery(s);
        this.selection &&
          this.currentValue !== i &&
          ((this.selection = null),
          (e.onInvalidateSelection || t.noop).call(this.element)),
          clearInterval(this.onChangeInterval),
          (this.currentValue = s),
          (this.selectedIndex = -1),
          e.triggerSelectOnValidInput && this.isExactMatch(i)
            ? this.select(0)
            : i.length < e.minChars
            ? this.hide()
            : this.getSuggestions(i);
      },
      isExactMatch: function (t) {
        var e = this.suggestions;
        return 1 === e.length && e[0].value.toLowerCase() === t.toLowerCase();
      },
      getQuery: function (e) {
        var s,
          i = this.options.delimiter;
        return i ? ((s = e.split(i)), t.trim(s[s.length - 1])) : e;
      },
      getSuggestionsLocal: function (e) {
        var s,
          i = this.options,
          n = e.toLowerCase(),
          o = i.lookupFilter,
          l = parseInt(i.lookupLimit, 10);
        return (
          (s = {
            suggestions: t.grep(i.lookup, function (t) {
              return o(t, e, n);
            }),
          }),
          l &&
            s.suggestions.length > l &&
            (s.suggestions = s.suggestions.slice(0, l)),
          s
        );
      },
      getSuggestions: function (e) {
        var s,
          i,
          n,
          o,
          l = this,
          a = l.options,
          r = a.serviceUrl;
        (a.params[a.paramName] = e),
          (i = a.ignoreParams ? null : a.params),
          !1 !== a.onSearchStart.call(l.element, a.params) &&
            (t.isFunction(a.lookup)
              ? a.lookup(e, function (t) {
                  (l.suggestions = t.suggestions),
                    l.suggest(),
                    a.onSearchComplete.call(l.element, e, t.suggestions);
                })
              : (l.isLocal
                  ? (s = l.getSuggestionsLocal(e))
                  : (t.isFunction(r) && (r = r.call(l.element, e)),
                    (n = r + "?" + t.param(i || {})),
                    (s = l.cachedResponse[n])),
                s && t.isArray(s.suggestions)
                  ? ((l.suggestions = s.suggestions),
                    l.suggest(),
                    a.onSearchComplete.call(l.element, e, s.suggestions))
                  : l.isBadQuery(e)
                  ? a.onSearchComplete.call(l.element, e, [])
                  : (l.abortAjax(),
                    (o = {
                      url: r,
                      data: i,
                      type: a.type,
                      dataType: a.dataType,
                    }),
                    t.extend(o, a.ajaxSettings),
                    (l.currentRequest = t
                      .ajax(o)
                      .done(function (t) {
                        var s;
                        (l.currentRequest = null),
                          (s = a.transformResult(t, e)),
                          l.processResponse(s, e, n),
                          a.onSearchComplete.call(l.element, e, s.suggestions);
                      })
                      .fail(function (t, s, i) {
                        a.onSearchError.call(l.element, e, t, s, i);
                      })))));
      },
      isBadQuery: function (t) {
        if (!this.options.preventBadQueries) return !1;
        for (var e = this.badQueries, s = e.length; s--; )
          if (0 === t.indexOf(e[s])) return !0;
        return !1;
      },
      hide: function () {
        var e = this.suggestionsContainer;
        t.isFunction(this.options.onHide) &&
          this.visible &&
          this.options.onHide.call(this.element, e),
          (this.visible = !1),
          (this.selectedIndex = -1),
          clearInterval(this.onChangeInterval),
          this.suggestionsContainer.hide(),
          this.signalHint(null);
      },
      suggest: function () {
        if (0 !== this.suggestions.length) {
          var e,
            s = this.options,
            i = s.groupBy,
            n = s.formatResult,
            o = this.getQuery(this.currentValue),
            l = this.classes.suggestion,
            a = this.classes.selected,
            r = this.suggestionsContainer,
            u = t(this.noSuggestionsContainer),
            h = s.beforeRender,
            c = "";
          s.triggerSelectOnValidInput && this.isExactMatch(o)
            ? this.select(0)
            : (t.each(this.suggestions, function (t, s) {
                i &&
                  (c += (function (t, s) {
                    var n = t.data[i];
                    return e === n
                      ? ""
                      : '<div class="autocomplete-group"><strong>' +
                          (e = n) +
                          "</strong></div>";
                  })(s, 0)),
                  (c +=
                    '<div class="' +
                    l +
                    '" data-index="' +
                    t +
                    '">' +
                    n(s, o) +
                    "</div>");
              }),
              this.adjustContainerWidth(),
              u.detach(),
              r.html(c),
              t.isFunction(h) && h.call(this.element, r),
              this.fixPosition(),
              r.show(),
              s.autoSelectFirst &&
                ((this.selectedIndex = 0),
                r.scrollTop(0),
                r
                  .children("." + l)
                  .first()
                  .addClass(a)),
              (this.visible = !0),
              this.findBestHint());
        } else
          this.options.showNoSuggestionNotice
            ? this.noSuggestions()
            : this.hide();
      },
      noSuggestions: function () {
        var e = this.suggestionsContainer,
          s = t(this.noSuggestionsContainer);
        this.adjustContainerWidth(),
          s.detach(),
          e.empty(),
          e.append(s),
          this.fixPosition(),
          e.show(),
          (this.visible = !0);
      },
      adjustContainerWidth: function () {
        var t,
          e = this.options,
          s = this.suggestionsContainer;
        "auto" === e.width &&
          ((t = this.el.outerWidth() - 2), s.width(t > 0 ? t : 300));
      },
      findBestHint: function () {
        var e = this.el.val().toLowerCase(),
          s = null;
        e &&
          (t.each(this.suggestions, function (t, i) {
            var n = 0 === i.value.toLowerCase().indexOf(e);
            return n && (s = i), !n;
          }),
          this.signalHint(s));
      },
      signalHint: function (e) {
        var s = "";
        e && (s = this.currentValue + e.value.substr(this.currentValue.length)),
          this.hintValue !== s &&
            ((this.hintValue = s),
            (this.hint = e),
            (this.options.onHint || t.noop)(s));
      },
      verifySuggestionsFormat: function (e) {
        return e.length && "string" == typeof e[0]
          ? t.map(e, function (t) {
              return { value: t, data: null };
            })
          : e;
      },
      validateOrientation: function (e, s) {
        return (
          (e = t.trim(e || "").toLowerCase()),
          -1 === t.inArray(e, ["auto", "bottom", "top"]) && (e = s),
          e
        );
      },
      processResponse: function (t, e, s) {
        var i = this.options;
        (t.suggestions = this.verifySuggestionsFormat(t.suggestions)),
          i.noCache ||
            ((this.cachedResponse[s] = t),
            i.preventBadQueries &&
              0 === t.suggestions.length &&
              this.badQueries.push(e)),
          e === this.getQuery(this.currentValue) &&
            ((this.suggestions = t.suggestions), this.suggest());
      },
      activate: function (e) {
        var s,
          i = this.classes.selected,
          n = this.suggestionsContainer,
          o = n.find("." + this.classes.suggestion);
        return (
          n.find("." + i).removeClass(i),
          (this.selectedIndex = e),
          -1 !== this.selectedIndex && o.length > this.selectedIndex
            ? ((s = o.get(this.selectedIndex)), t(s).addClass(i), s)
            : null
        );
      },
      selectHint: function () {
        var e = t.inArray(this.hint, this.suggestions);
        this.select(e);
      },
      select: function (t) {
        this.hide(), this.onSelect(t);
      },
      moveUp: function () {
        if (-1 !== this.selectedIndex)
          return 0 === this.selectedIndex
            ? (this.suggestionsContainer
                .children()
                .first()
                .removeClass(this.classes.selected),
              (this.selectedIndex = -1),
              this.el.val(this.currentValue),
              void this.findBestHint())
            : void this.adjustScroll(this.selectedIndex - 1);
      },
      moveDown: function () {
        this.selectedIndex !== this.suggestions.length - 1 &&
          this.adjustScroll(this.selectedIndex + 1);
      },
      adjustScroll: function (e) {
        var s = this.activate(e);
        if (s) {
          var i,
            n,
            o,
            l = t(s).outerHeight();
          (i = s.offsetTop),
            (o =
              (n = this.suggestionsContainer.scrollTop()) +
              this.options.maxHeight -
              l),
            i < n
              ? this.suggestionsContainer.scrollTop(i)
              : i > o &&
                this.suggestionsContainer.scrollTop(
                  i - this.options.maxHeight + l
                ),
            this.options.preserveInput ||
              this.el.val(this.getValue(this.suggestions[e].value)),
            this.signalHint(null);
        }
      },
      onSelect: function (e) {
        var s = this.options.onSelect,
          i = this.suggestions[e];
        (this.currentValue = this.getValue(i.value)),
          this.currentValue === this.el.val() ||
            this.options.preserveInput ||
            this.el.val(this.currentValue),
          this.signalHint(null),
          (this.suggestions = []),
          (this.selection = i),
          t.isFunction(s) && s.call(this.element, i);
      },
      getValue: function (t) {
        var e,
          s,
          i = this.options.delimiter;
        return i
          ? 1 === (s = (e = this.currentValue).split(i)).length
            ? t
            : e.substr(0, e.length - s[s.length - 1].length) + t
          : t;
      },
      dispose: function () {
        this.el.off(".autocomplete").removeData("autocomplete"),
          this.disableKillerFn(),
          t(window).off("resize.autocomplete", this.fixPositionCapture),
          this.suggestionsContainer.remove();
      },
    }),
    (t.fn.autocomplete = t.fn.devbridgeAutocomplete =
      function (e, s) {
        return 0 === arguments.length
          ? this.first().data("autocomplete")
          : this.each(function () {
              var i = t(this),
                n = i.data("autocomplete");
              "string" == typeof e
                ? n && "function" == typeof n[e] && n[e](s)
                : (n && n.dispose && n.dispose(),
                  (n = new r(this, e)),
                  i.data("autocomplete", n));
            });
      });
});

/**
 * AJAX SEARCH
 */
jQuery(document).ready(function () {
  "use strict";

  jQuery(".is-ajax-search").devbridgeAutocomplete({
    serviceUrl: tie.ajaxurl,
    params: { action: "tie_ajax_search" },
    type: "post",
    minChars: 3,
    width: 370,
    maxHeight: "auto",
    noSuggestionNotice: tie.lang_no_results,
    showNoSuggestionNotice: true,
    onSearchStart: function (query) {
      jQuery(this)
        .parent()
        .find(".tie-search-icon")
        .removeClass("tie-icon-search")
        .addClass("tie-icon-spinner");
    },
    onSearchComplete: function (query) {
      jQuery(this)
        .parent()
        .find(".tie-search-icon")
        .removeClass("tie-icon-spinner")
        .addClass("tie-icon-search");

      if (tie.lazyload) {
        jQuery("#autocomplete-suggestions")
          .find(".lazy-img")
          .each(function () {
            jQuery(this)
              .attr("src", jQuery(this).attr("data-src"))
              .removeAttr("data-src");
          });
      }
    },
    formatResult: function (suggestion, currentValue) {
      return suggestion.layout;
    },
    onSelect: function (suggestion) {
      window.location = suggestion.url;
    },
  });
});
