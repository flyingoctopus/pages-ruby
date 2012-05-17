var config = {};
var selectedDeviceId;
var editors = [];

$(document).ready(function() {
  setInterval("cacheLocalCode()", 5000);

  findSerialOSCDevices(function() {
    selectedDeviceId = $.cookie('selectedDeviceId');
    if (selectedDeviceId != undefined) selectDevice(selectedDeviceId);
  });
  findMIDIDevices();

  $('.serialosc-menu-toggle').dropdown();

  $('.device-option').live('click', function() {
    cacheLocalCode();
    var id = $(this).attr('data-id');
    selectDevice(id);
  });

  $('#toolbar-new-page').live('click', function() {
    $('#new-page-modal').modal('show');
  });

  $('#toolbar-midi-matrix').live('click', function() {
    $('#midi-matrix-modal').modal('show');
  });

  $('.device-tab').live('click', function(event) {
    event.preventDefault();
    $('li .device-tab').each(function() {
      if ($(this).closest('li').hasClass('active')) {
        var oldDeviceId = $(this).attr('data-device-id');
        var oldPageIndex = $(this).attr('data-page-index');
        var oldEditorId = 'editor-' + oldDeviceId + '-' + oldPageIndex;
        $('#' + oldEditorId).hide();
        $(this).closest('li').removeClass('active');
      }
    });
    $(this).closest('li').addClass('active');
    var deviceId = $(this).attr('data-device-id');
    var pageIndex = $(this).attr('data-page-index');
    var newEditorId = 'editor-' + deviceId + '-' + pageIndex;
    $('#' + newEditorId).show();
  });

  $('#new-page-save').live('click', function() {
    if (selectedDeviceId == undefined) {
      alert('Select a device');
      return;
    }
    var newPageName = $('#new-page-name').val();
    newPage(newPageName);
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
            .attr('data-id', device.id)
            .text(k)
          )
        );
        //.append('<li><a href="#" class="device-option" data-id="' + device.id + '">' + k + '</a></li>');
    });
    if (typeof callback == 'function') callback();
  });
}

function findMIDIDevices(callback) {
  $.getJSON('/devices/midi', function(data) {
    config.midi = data;
    $('.midi-output-dropdown').html('');
    $.each(data['output'], function(k, device) {
      $('.midi-output-dropdown')
        .append('<option value=' + device.id + '">' + device.name + '</option>');
    });
    $('.midi-input-dropdown').html('');
    $.each(data['input'], function(k, device) {
      $('.midi-input-dropdown')
        .append('<option value=' + device.id + '">' + device.name + '</option>');
    });
    if (typeof callback == 'function') callback();
  });
}

function newPage(newPageName) {
  $.ajax({
    type: 'post',
    url: '/pages',
    data: 'device=' + selectedDeviceId + '&name=' + newPageName,
    success: function(response) {
      var responseObj = $.parseJSON(response);
      config.devices[selectedDeviceId].pages = response;
      var pageIndex = responseObj.length - 1;
      $('#new-page-modal').modal('hide');
      loadEditor({
        deviceId: selectedDeviceId, 
        pageIndex: pageIndex,
        pageName: newPageName
      });
      config.devices[selectedDeviceId].pages[pageIndex] = { code: null, name: newPageName };
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
  $('.selected-device a').html(device.id);
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
}

function loadEditor(params) {
  var deviceId = params.deviceId;
  var pageIndex = params.pageIndex;
  var pageName = params.pageName;
  var newTab = $('<li><a href="#" data-toggle="tab" class="device-tab" data-device-id="' + deviceId + '" data-page-index="' + pageIndex + '">' + pageName + '</a></li>');
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
  $('#' + editorId).css('height', $(window).height() - 40 - 26 - 34);
  editors[editorId] = editor;
}

function cacheLocalCode() {
  if (typeof selectedDeviceId != 'string') return;
  for (var i = 0; i < config.devices[selectedDeviceId].pages.length; i++) {
    var editorId = 'editor-' + selectedDeviceId + '-' + i;
    if ($('#' + editorId).size() > 0) {
      var editor = editors[editorId];
      $.jStorage.set(editorId, editor.getSession().getValue());
    }
  }
}