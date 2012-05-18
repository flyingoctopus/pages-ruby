var config = {};
var selectedDeviceId;
var editors = [];
var midiMap = [];
$(window).resize(function() {
  $('.editor').each(function() {
    resizeEditor($(this).attr('id'));
  })
})

$(document).ready(function() {
  setInterval("cacheLocalCode()", 5000);

  /**
   * serialosc menu
   */
  findSerialOSCDevices(function() {
    selectedDeviceId = parseInt($.cookie('selectedDeviceId'));
    if (selectedDeviceId != undefined && config.devices[selectedDeviceId] != undefined) {
      selectDevice(selectedDeviceId);
    }
  });
  $('.serialosc-menu-toggle').dropdown();
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
   * toolbar - midi map
   */
  $('#toolbar-midi-map').live('click', function(e) {
    e.preventDefault();
    if (!checkDeviceSelected()) return;
    $('.page-dropdown').html('<option value="">.. select a page ..</option>');
    for (var i = 0; i < config.devices[selectedDeviceId].pages.length; i++) {
      var page = config.devices[selectedDeviceId].pages[i];
      $('.page-dropdown').append('<option value="'+i+'">'+page.name+'</option>');
    }
    $('.create-mapping-ctrls').hide();
    $('.midi-output-dropdown').hide();
    $('.midi-input-dropdown').hide();
    $('.midi-map-button').hide();
    findMIDIDevices(function() {
      getMidiMap();
      $('#midi-map-modal').modal('show');
    });
  });
  $('.midi-input-btn').live('click', function() {
    $('.create-mapping-ctrls').show();
    $('.midi-output-dropdown').hide();
    $('.midi-input-dropdown').show();
    showMidiMapButton();
  });
  $('.midi-output-btn').live('click', function() {
    $('.create-mapping-ctrls').show();
    $('.midi-output-dropdown').show();
    $('.midi-input-dropdown').hide();
    showMidiMapButton();
  });
  $('.midi-output-dropdown').live('change', function() {
    showMidiMapButton();
  })
  $('.midi-input-dropdown').live('change', function() {
    showMidiMapButton();
  })
  $('.page-dropdown').live('change', function() {
    showMidiMapButton();
  })
  $('.midi-map-button').live('click', function() {
    createMidiMap(function() {
      getMidiMap();
    })
  })
  $('.midi-unmap-button').live('click', function() {
    destroyMidiMap($(this), function() {
      getMidiMap();
    })
  })

  /**
   * toolbar - zoom
   */
  $('#toolbar-zoom-in').live('click', function(e) {
    e.preventDefault();
  })
  $('#toolbar-zoom-out').live('click', function(e) {
    e.preventDefault();
  })

  /**
   * page tabs
   */
  $('.device-tab').live('click', function(event) {
    event.preventDefault();
    $('li .device-tab').each(function() {
      if ($(this).closest('li').hasClass('active')) {
        var oldDeviceId = $(this).attr('data-device-id');
        var oldPageIndex = $(this).attr('data-page-index');
        var oldEditorId = 'editor-' + oldDeviceId + '-' + oldPageIndex;
        if ($('#' + oldEditorId).is(':visible')) {
          $('#' + oldEditorId).hide();
        }
        $(this).closest('li').removeClass('active');
      }
    });
    $(this).closest('li').addClass('active');
    var deviceId = $(this).attr('data-device-id');
    var pageIndex = $(this).attr('data-page-index');
    var newEditorId = 'editor-' + deviceId + '-' + pageIndex;
    $('#' + newEditorId).show();
  });
});

function findSerialOSCDevices(callback) {
  $.getJSON('/devices/serialosc', function(data) {
    config.devices = data;
    $('.serialosc-dropdown').html('');
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

function createMidiMap(callback) {
  var type = 'output';
  if ($('.midi-input-dropdown').is(':visible')) type = 'input';
  var postData = 'device=' + selectedDeviceId;
  postData += '&page=' + $('.page-dropdown').val();
  postData += '&midi=' + ($('.midi-' + type + '-dropdown').val());
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
            .append($('<td>').css('text-align', 'center').html('<img src="/img/icons/unmap.png"/>')
              .addClass('midi-unmap-button')
              .attr('data-map-index', i)
              .attr('data-page-index', pageId)
            )
          );
      }
    }
  });
}

function destroyMidiMap(btn, callback) {
  var mapIndex = btn.attr('data-map-index');
  var pageIndex = btn.attr('data-page-index');
  $.ajax({
    type: 'delete',
    url: '/midi_matrix?device=' + selectedDeviceId + '&map=' + mapIndex + '&page=' + pageIndex,
    success: function() {
      if (typeof callback == 'function') callback();
    }
  })
}

function newPage(newPageName) {
  $.ajax({
    type: 'post',
    url: '/pages',
    data: 'device=' + selectedDeviceId + '&name=' + newPageName,
    success: function(response) {
      $('#new-page-modal').modal('hide');
      var responseObj = $.parseJSON(response);
      var pageIndex = responseObj.length - 1;
      loadEditor({
        deviceId: selectedDeviceId, 
        pageIndex: pageIndex,
        pageName: newPageName
      });
      config.devices[selectedDeviceId].pages[pageIndex] = { code: null, name: newPageName };
      setTimeout("$('.device-tab:last').click();", 100);
    }
  });
}

function selectDevice(id) {
  var device = config.devices[id];
  if (id != selectedDeviceId) {
    $.cookie('selectedDeviceId', id);
    selectedDeviceId = id;
  }
  loadEditors(id);
  $('.device-tab:last').parent().addClass('active');
  $('.selected-device a').html(device.name);
}

function loadEditors(id) {
  $('#editors').html('');
  $('#editor-tabs').html('');
  for (var i = 0; i < config.devices[id].pages.length; i++) {
    loadEditor({
      deviceId: id,
      pageIndex: i,
      pageName: config.devices[id].pages[i].name
    });
  }
  setTimeout("$('.editor').hide(); $('.device-tab:last').click();", 100);
}

function loadEditor(params) {
  console.log("load editor");
  console.log(params);
  var deviceId = params.deviceId;
  var pageIndex = params.pageIndex;
  var pageName = params.pageName;
  var newTab = $('<li>')
    .append($('<a>')
      .attr('href', '#')
      .attr('data-toggle', 'tab')
      .attr('data-device-id', deviceId)
      .attr('data-page-index', pageIndex)
      .addClass('device-tab')
      .append(pageName)
    );
  $('#editor-tabs').append(newTab);
  var editorId = "editor-" + deviceId + "-" + pageIndex;
  $('#editors').append('<div id="' + editorId + '" class="editor"></div>');
  var editor = ace.edit(editorId);
  editor.setTheme("ace/theme/twilight");
  var RubyMode = require("ace/mode/ruby").Mode;
  editor.getSession().setMode(new RubyMode());
  editor.setShowPrintMargin(false);  
  var localCode = $.jStorage.get(editorId);
  if (localCode != null) {
    editor.getSession().setValue(localCode);
  }
  editors[editorId] = editor;
  resizeEditor(editorId);
}

function cacheLocalCode() {
  if (selectedDeviceId == undefined || config.devices[selectedDeviceId] == undefined) {
    return;
  }
  for (var i = 0; i < config.devices[selectedDeviceId].pages.length; i++) {
    var editorId = 'editor-' + selectedDeviceId + '-' + i;
    if ($('#' + editorId).size() > 0) {
      var editor = editors[editorId];
      $.jStorage.set(editorId, editor.getSession().getValue());
    }
  }
}

function resizeEditor(editorId) {
  $('#' + editorId).css('height', 
    $(window).height() - $('#editor-tabs').height() 
    - $('#toolbar').height() - $('.navbar-fixed-top').height()
    - 10);
}

function checkDeviceSelected() {
  if (selectedDeviceId == undefined || config.devices[selectedDeviceId] == undefined) {
    alert("Please select a device");
    return false;
  }
  return true;
}

function showMidiMapButton() {
  console.log("showmidimapbutton");
  console.log($('.page-dropdown').val());
  if ($('.page-dropdown').val() == '') {
    $('.midi-map-button').hide();
    return;
  }
  if ($('.midi-output-dropdown').is(':visible')) {
    if ($('.midi-output-dropdown').val() == '') {
      $('.midi-map-button').hide();
      return;
    }
  }
  if ($('.midi-input-dropdown').is(':visible')) {
    if ($('.midi-input-dropdown').val() == '') {
      $('.midi-map-button').hide();
      return;
    }
  }
  $('.midi-map-button').show();
}