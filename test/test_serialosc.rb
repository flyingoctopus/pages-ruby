require 'test/unit'
require 'shoulda'
require 'osc-ruby'
require_relative '../lib/pages/serialosc'

class TestSerialOSC < Test::Unit::TestCase
  serialosc = MonomePages::SerialOSC.new
  # register a test grid and arc
  serialosc.register 'test grid', 12345
  serialosc.register 'test arc 4', 23456
  serialosc.register 'test disconnect', 34567
  puts "registering test devices..."
  sleep 1
  # detect the test devices
  serialosc.detect
  puts "detecting test devices..."
  sleep 1
  grid = serialosc.find{|d| d.name == 'test grid'}
  arc = serialosc.find{|d| d.name == 'test arc 4'}
  disc = serialosc.find{|d| d.name == 'test disconnect'}
  # set id for arc
  oscClient = OSC::Client.new 'localhost', arc.listen_port
  oscClient.send OSC::Message.new('/sys/id', 'testarc')
  # emulate 8x8 size response from serialosc for the grid
  oscClient = OSC::Client.new 'localhost', grid.listen_port
  oscClient.send OSC::Message.new('/sys/size', 8, 8)
  oscClient.send OSC::Message.new('/sys/id', 'testgrid')
  # emulate disconnect message
  oscClient = OSC::Client.new 'localhost', disc.listen_port
  oscClient.send OSC::Message.new('/sys/disconnect')
  oscClient.send OSC::Message.new('/sys/id', 'testdisconnect')
  puts "configuring test devices..."
  sleep 1

  context "test grid" do
    should "register and discover" do
      assert_not_nil serialosc.find{|d| d.name == 'test grid'}, true
    end
  end

#  context "test grid" do
#    should "attach grid_key callback" do
#      code = <<-code
#        def grid_key(args)
#          @test = true
#        end
#        def test
#          @test || false
#        end
#      code
#      device = serialosc.devices['test grid']
#      oscClient = OSC::Client.new 'localhost', device.listen_port
#      device.instance_eval code
#      oscClient.send OSC::Message.new('/monome/grid/key', 0, 0, 1)
#      sleep 1
#      assert_equal device.test, true
#    end
#  end

  context "test grid" do
    should "detect 8x8 monome" do
      device = serialosc.find{|d| d.name == 'test grid'}
      assert_equal true, device.type == :grid and device.size_x == 8 and device.size_y == 8
    end
  end

  context "test arc 4" do
    should "detect arc with 4 encoders" do
      device = serialosc.find{|d| d.name == 'test arc 4'}
      assert_equal true, device.type == :arc and device.encoders == 4
    end
  end

  context "test disconnect" do
    should "detect device was disconnected" do
      device = serialosc.find{|d| d.name == 'test disconnect'}
      assert_equal false, device.connected
    end
  end

end