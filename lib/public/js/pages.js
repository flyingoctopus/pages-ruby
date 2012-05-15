var config = {};
var selectedDeviceId;
var editors = [];

$(document).ready(function() {
  initialize();
})

function initialize() {

  $('.serialosc-menu-toggle').dropdown();

  $.getJSON('/devices', function(data) {
    config.devices = data;
    $.each(data, function(k, device) {
      $('.serialosc-dropdown').append('<li><a href="#" class="device-option" data-id="' + device.id + '">' + k + '</a></li>');
    });
    selectedDeviceId = $.cookie('selectedDeviceId');
    if (selectedDeviceId != undefined) selectDevice(selectedDeviceId);
    setInterval("cacheLocalCode()", 5000);
  });

  $('.device-option').live('click', function() {
    cacheLocalCode();
    var id = $(this).attr('data-id');
    selectDevice(id);
  });

 $('#toolbar-new-page').live('click', function() {
    $('#new-page-modal').modal('show');
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