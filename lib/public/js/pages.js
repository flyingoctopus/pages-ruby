var config = {};
var selectedDeviceId;
var editors = [];
var midiMap = [];
var windowResizeInterval;
var windowResizeTimeout;

$(window).resize(function() {
  $('.editor').each(function() {
    resizeEditor($(this).attr('id'));
  })
})

$(document).ready(function() {
  /**
   * init
   */
  $('.btn-navbar').live('click', function(e) {
    if (windowResizeInterval != null) {
      clearInterval(windowResizeInterval);
    }
    if (windowResizeTimeout != null) {
      clearTimeout(windowResizeTimeout);
    }
    windowResizeInterval = setInterval("$('.editor').each(function() { resizeEditor($(this).attr('id')); });", 50);
    windowResizeTimeout = setTimeout("clearInterval(windowResizeInterval); windowResizeInterval = null;", 1000);
  });

  /**
   * serialosc menu
   */
  findSerialOSCDevices(function() {
    selectedDeviceId = parseInt($.cookie('selectedDeviceId'));
    if (selectedDeviceId != undefined && config.devices[selectedDeviceId] != undefined) {
      selectedPageId = $.cookie('selectedPageId');
      selectDevice(selectedDeviceId); 
    }

  });
  //$('.serialosc-menu-toggle').dropdown();
  $('.device-option').live('click', function() {
    cacheLocalCode();
    var id = $(this).attr('data-id');
    selectDevice(id);
  });

  /**
   * toolbar - new page
   */
  $('#toolbar-new-page').live('click', function() {
    if (!checkDeviceSelected()) return;
    $('#new-page-modal').modal('show');
  });
  $('#new-page-save').live('click', function() {
    var newPageName = $('#new-page-name').val();
    newPage(newPageName);
  });

  /**
   * common midi controls
   */
  $('.midi-input-btn').live('click', function() {
    $('.ctrls').show();
    $('.midi-output-dropdown').hide();
    $('.midi-input-dropdown').show();
    if ($('#midi-map-modal').is(':visible')) {
      showMidiMapButton();
    }
    if ($('#midi-setup-modal').is(':visible')) {
      showMidiEnableButton();
    }
  });
  $('.midi-output-btn').live('click', function() {
    $('.ctrls').show();
    $('.midi-output-dropdown').show();
    $('.midi-input-dropdown').hide();
    if ($('#midi-map-modal').is(':visible')) {
      showMidiMapButton();
    }
    if ($('#midi-setup-modal').is(':visible')) {
      showMidiEnableButton();
    }
  });
  $('.midi-output-dropdown').live('change', function() {
    if ($('#midi-map-modal').is(':visible')) {
      showMidiMapButton();
    }
    if ($('#midi-setup-modal').is(':visible')) {
      showMidiEnableButton();
    }
  })
  $('.midi-input-dropdown').live('change', function() {
    if ($('#midi-map-modal').is(':visible')) {
      showMidiMapButton();
    }
    if ($('#midi-setup-modal').is(':visible')) {
      showMidiEnableButton();
    }
  })

  /**
   * midi menu
   */
  $('.midi-dropdown .setup').live('click', function(e) {
    e.preventDefault();
    $('#midi-setup-modal').modal('show');
    resetMidiModalControls();
    findMIDIDevices(function() {
      getMidiMap();
      $('#midi-setup-modal').modal('show');
    });
  });

  /**
   * toolbar - midi map
   */
  $('#toolbar-midi-map').live('click', function(e) {
    e.preventDefault();
    if (!checkDeviceSelected()) return;
    resetMidiModalControls();
    findMIDIDevices(function() {
      getMidiMap();
      $('#midi-map-modal').modal('show');
    });
  });
  $('#midi-map-modal').find('.midi-map-button').live('click', function() {
    createMidiMap(function() {
      getMidiMap();
    })
  })
  $('#midi-map-modal').find('.midi-unmap-button').live('click', function() {
    destroyMidiMap($(this), function() {
      getMidiMap();
    })
  })

  /**
   * page tabs
   */
  $('.device-tab').live('click', function(event) {
    event.preventDefault();
    $('li .device-tab').each(function() {
      if ($(this).closest('li').hasClass('active')) {
        var oldPageId = $(this).attr('data-page-id');
        var oldEditorId = 'editor-' + selectedDeviceId + '-' + oldPageId;
        if ($('#' + oldEditorId).is(':visible')) {
          $('#' + oldEditorId).hide();
        }
        $(this).closest('li').removeClass('active');
      }
    });
    $(this).closest('li').addClass('active');
    selectedPageId = $(this).attr('data-page-id');
    $.cookie('selectedPageId', selectedPageId);
    var newEditorId = 'editor-' + selectedDeviceId + '-' + selectedPageId;
    $('#' + newEditorId).show();
  });
});

/**
 * serialosc menu
 */
function findSerialOSCDevices(callback) {
  $.getJSON('/devices/serialosc', function(data) {
    config.devices = data;
    $('.serialosc-dropdown').html('<li><a href="#" class="setup">setup</a></li>');
    $.each(data, function(k, device) {
      $('.serialosc-dropdown')
        .append($('<li>')
          .append($('<a>')
            .addClass('device-option')
            .attr('href', '#')
            .attr('data-id', k)
            .text(device.name)
          )
        );
    });
    if (typeof callback == 'function') callback();
  });
}

/**
 * common midi
 */
function resetMidiModalControls() {
  $('.ctrls').hide();
  $('.midi-output-dropdown').hide();
  $('.midi-input-dropdown').hide();
  if ($('#midi-map-modal').is(':visible')) {
    $('.midi-map-button').hide();
  }
  if ($('#midi-setup-modal').is(':visible')) {
    $('.midi-enable-button').hide();
    $('.midi-device-alias').hide();
  }
}

function findMIDIDevices(callback) {
  $.getJSON('/devices/midi', function(data) {
    config.midi = data;
    $('.midi-output-dropdown').html('<option value="">.. select a device ..</option>');
    $.each(data['output'], function(k, device) {
      $('.midi-output-dropdown')
        .append('<option value="' + k + '">' + device.name + '</option>');
    });
    $('.midi-input-dropdown').html('<option value="">.. select a device ..</option>');
    $.each(data['input'], function(k, device) {
      $('.midi-input-dropdown')
        .append('<option value="' + k + '">' + device.name + '</option>');
    });
    if (typeof callback == 'function') callback();
  });
}

/**
 * midi map
 */

function createMidiMap(callback) {
  var scope = $('#midi-map-modal');
  var type = 'output';
  if (scope.find('.midi-input-dropdown').is(':visible')) type = 'input';
  var postData = 'device=' + selectedDeviceId;
  postData += '&page=' + selectedPageId;
  postData += '&midi=' + (scope.find('.midi-' + type + '-dropdown').val());
  postData += '&type=' + type;
  console.log(postData);
  $.ajax({
    type: 'post',
    url: '/midi_matrix',
    data: postData,
    success: function() {
      if (typeof callback == 'function') callback();
    }
  });
}

function getMidiMap() {
  $.getJSON('/midi_matrix', function(data) {
    midiMap = data;
    $('.existing-mappings')
      .html($('<table>')
        .addClass('table')
        .append($('<tr>')
          .append($('<th>').html('page'))
          .append($('<th>').html('midi device'))
          .append($('<th>').html('type'))
          .append($('<th>').html('unmap').css('text-align', 'center'))
      ));
    if (selectedDeviceId == undefined || midiMap[selectedDeviceId] == undefined) return;
    for (var pageId in midiMap[selectedDeviceId]['pages']) {
      var page = config.devices[selectedDeviceId]['pages'][pageId];
      var mappings = midiMap[selectedDeviceId]['pages'][pageId]['map'];
      for (var i = 0; i < mappings.length; i++) {
        var midiId = mappings[i].id;
        $('.existing-mappings table')
          .append($('<tr>')
            .append($('<td>').text(page.name))
            .append($('<td>').text(config.midi[mappings[i].type][midiId].name))
            .append($('<td>').text(mappings[i].type))
            .append($('<td>').css('text-align', 'center')
              .append($('<img>')
                .attr('src', "/img/icons/unmap.png")
                .addClass('midi-unmap-button')
                .attr('data-map-index', i)
                .attr('data-page-id', pageId)
              )
            )
          );
      }
    }
  });
}

function destroyMidiMap(btn, callback) {
  var mapIndex = btn.attr('data-map-index');
  var pageId = btn.attr('data-page-id');
  $.ajax({
    type: 'delete',
    url: '/midi_matrix?device=' + selectedDeviceId + '&map=' + mapIndex + '&page=' + pageId,
    success: function() {
      if (typeof callback == 'function') callback();
    }
  })
}

function showMidiMapButton() {
  var scope = $('#midi-map-modal');
  if (scope.find('.midi-output-dropdown').is(':visible')) {
    if (scope.find('.midi-output-dropdown').val() == '') {
      scope.find('.midi-map-button').hide();
      return;
    }
  }
  if (scope.find('.midi-input-dropdown').is(':visible')) {
    if (scope.find('.midi-input-dropdown').val() == '') {
      scope.find('.midi-map-button').hide();
      return;
    }
  }
  scope.find('.midi-map-button').show();
}

/**
 * midi setup
 */

function showMidiEnableButton() {
  var scope = $('#midi-setup-modal');

  if (scope.find('.midi-output-dropdown').is(':visible')) {
    if (scope.find('.midi-output-dropdown').val() == '') {
      scope.find('.midi-enable-button').hide();
      scope.find('.midi-device-alias').hide();
      return;
    }
  }
  if (scope.find('.midi-input-dropdown').is(':visible')) {
    if (scope.find('.midi-input-dropdown').val() == '') {
      scope.find('.midi-enable-button').hide();
      scope.find('.midi-device-alias').hide();
      return;
    }
  }
  scope.find('.midi-enable-button').show();
  scope.find('.midi-device-alias').show();
}

function getMidiSetup() {
  $.getJSON('/devices/midi', function(data) {
    midiMap = data;
    $('.enabled-devices')
      .html($('<table>')
        .addClass('table')
        .append($('<tr>')
          .append($('<th>').html('alias'))
          .append($('<th>').html('midi device'))
          .append($('<th>').html('type'))
          .append($('<th>').html('disable').css('text-align', 'center'))
      ));
    for (device in data) {
      if (!device.enabled) continue;
      $('.enabled-devices table')
        .append($('<tr>')
          .append($('<td>').text(device.alias))
          .append($('<td>').text(device.name))
          .append($('<td>').text(device.type))
          .append($('<td>').css('text-align', 'center')
            .append($('<img>')
              .attr('src', "/img/icons/unmap.png")
              .addClass('disable-device-button')
              .attr('data-device-alias', device.alias)
            )
          )
        );
    }
  });
}

/**
 * new page
 */
function newPage(newPageName) {
  $.ajax({
    type: 'post',
    url: '/pages',
    data: 'device=' + selectedDeviceId + '&name=' + newPageName,
    success: function(response) {
      $('#new-page-modal').modal('hide');
      var responseObj = $.parseJSON(response);
      var pageId = responseObj.length - 1;
      loadEditor({
        deviceId: selectedDeviceId, 
        pageId: pageId,
        pageName: newPageName
      });
      config.devices[selectedDeviceId].pages[pageId] = { code: null, name: newPageName };
      setTimeout("$('.device-tab[data-page-id=" + pageId + "]').click();", 100);
    }
  });
}

/**
 * selected device
 */
function selectDevice(id) {
  var device = config.devices[id];
  if (id != selectedDeviceId) {
    $.cookie('selectedDeviceId', id);
    selectedDeviceId = id;
  }
  loadEditors(id);
  if (selectedPageId != undefined) {
    $('.device-tab[data-page-id=' + selectedPageId + ']').parent().addClass('active');
  } else {
    $('.device-tab:last').parent().addClass('active');
  }
  $('.brand').html(device.name);
}

function checkDeviceSelected() {
  if (selectedDeviceId == undefined || config.devices[selectedDeviceId] == undefined) {
    alert("Please select a device");
    return false;
  }
  return true;
}

/**
 * editors
 */

function loadEditors(id) {
  $('#editors').html('');
  $('#editor-tabs').html('');
  for (var i = 0; i < config.devices[id].pages.length; i++) {
    loadEditor({
      deviceId: id,
      pageId: i,
      pageName: config.devices[id].pages[i].name
    });
  }
  setTimeout("$('.editor').hide(); $('.device-tab[data-page-id=" + selectedPageId + "]').click();", 100);
}

function loadEditor(params) {
  var deviceId = params.deviceId;
  var pageId = params.pageId;
  var pageName = params.pageName;
  var device = config.devices[deviceId];
  var page = config.devices[deviceId].pages[pageId];
  var newTab = $('<li>')
    .append($('<a>')
      .attr('href', '#')
      .attr('data-toggle', 'tab')
      .attr('data-device-id', deviceId)
      .attr('data-page-id', pageId)
      .addClass('device-tab')
      .append(pageName)
    );
  $('#editor-tabs').append(newTab);
  var editorId = "editor-" + deviceId + "-" + pageId;
  $('#editors').append('<div id="' + editorId + '" class="editor"></div>');
  var editor = ace.edit(editorId);
  editor.setTheme("ace/theme/twilight");
  var RubyMode = require("ace/mode/ruby").Mode;
  editor.getSession().setMode(new RubyMode());
  editor.getSession().on('change', function() { 
    cacheLocalCode();
  });
  editor.setShowPrintMargin(false);
  editors[editorId] = editor;
  resizeEditor(editorId);

  if (page == undefined) return;

  var localCode = $.jStorage.get(getLocalCodeCacheId(device, page));
  if (localCode != null) {
    editor.getSession().setValue(localCode);
  }
}

function resizeEditor(editorId) {
  var newHeight = $(window).height() - $('#editor-tabs').height() 
    - $('#toolbar').height() - $('.navbar-fixed-top').height()
    - 20

  $('#' + editorId).css('height', newHeight);
  //editor.find('.ace_scroller').css('height', newHeight);
}

/**
 * local cache
 */
function cacheLocalCode() {
  if (selectedDeviceId == undefined || config.devices[selectedDeviceId] == undefined) {
    return;
  }
  for (var i = 0; i < config.devices[selectedDeviceId].pages.length; i++) {
    var editorId = 'editor-' + selectedDeviceId + '-' + i;
    if ($('#' + editorId).size() > 0) {
      var editor = editors[editorId];
      var device = config.devices[selectedDeviceId];
      var page = config.devices[selectedDeviceId].pages[i];
      $.jStorage.set(getLocalCodeCacheId(device, page), editor.getSession().getValue());
    }
  }
}

function getLocalCodeCacheId(device, page) {
  var cacheId = device.name + '-' + page.name + '-localcode';
  return cacheId;
}
