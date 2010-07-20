#/*
#   The Q Code is just a code like urlencode, but its safe for the
#   window.localtion.hash encode. I choosed the q out of the fact it
#   is the 17 letter in the alphapet. So it possible to encode hex with
#   A-P's. And the letter q is not used as much in the written languages.
#
#   Use it and feel free, i never done any performance test
# */
class Q 
  def self.valid_keys
      _valid_keys = []
      [{:start =>' ', :end =>'~'}].each do |e|
        (e[:start].bytes.to_a[0]..e[:end].bytes.to_a[0]).each do |i|
          _valid_keys[i] = [i].pack('C*')
        end
      end
      _valid_keys[("+").bytes.to_a[0]] = nil
      _valid_keys[(" ").bytes.to_a[0]] = nil
      _valid_keys[("?").bytes.to_a[0]] = nil
      _valid_keys[("X").bytes.to_a[0]] = nil
      _valid_keys[("q").bytes.to_a[0]] = nil
      _valid_keys[("Q").bytes.to_a[0]] = nil
      _valid_keys
  end
  ValidKeys = self.valid_keys()
  Radix = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']

  def self.q_encode(num)
    return '+'  if (num == 32) 
    return "XX" if (num == 88) 
    return "X"  if (num == 63) 
    return "qq" if (num == 113) 
    return "QQ" if (num == 81)  
    return "++" if (num == 43)  
    if (num < 0x100) 
      return "q" + Radix[(num>>4)&0xf] + Radix[(num>>0)&0xf] 
    end
    return "Q" + Radix[(num>>12)&0xf] + Radix[(num>>8)&0xf] + Radix[(num>>4)&0xf] + Radix[(num>>0)&0xf]
  end

  def self.encode(str)
    str.bytes.map do |num|
      if (Q::ValidKeys[num]) 
        [num].pack('C')
      else
        q_encode(num)
      end
    end.join('')
  end  

  Base = ("A").bytes.to_a[0]
  def self.q_decode(str) 
    qq = str[0,2]
    return { :decoded => 'X', :len => 2 } if (qq == 'XX') 
    return { :decoded => 'Q', :len => 2 } if (qq == 'QQ') 
    return { :decoded => 'q', :len => 2 } if (qq == 'qq') 
    return { :decoded => '+', :len => 2 } if (qq == '++') 
    bytes = str.upcase.bytes.to_a
    mode = qq.chars.to_a.first
    if (mode == '+') 
      return { :decoded => ' ', :len => 1 }
    elsif (mode == 'Q') 
      return { :decoded => [(((bytes[1]-Q::Base)<<12)|((bytes[2]-Q::Base)<<8)|
                             ((bytes[3]-Q::Base)<<4) |((bytes[4]-Q::Base)<<0))].pack('C'), :len => 5 }
    elsif (mode == 'q')
      return { :decoded => [((bytes[1]-Q::Base)<<4)|(bytes[2]-Q::Base)].pack('C'), :len => 3 }
    end
  end

  def self.decode(hash)
    out = []
    len = hash.length
    i = 0
    while (i < len)
      c = hash[i,1]
      if (!ValidKeys[c.bytes.to_a.first])
        ret = q_decode(hash[i,5])
        out.push(ret[:decoded])
        i += ret[:len] # q/Q read before
      else 
        out.push(c)
        i += 1
      end
    end
    return out.join('')
  end

end

base = '{ÄmenoqgiesbertQabelsÜ%:"meno", meno: { all: "meno" }}'
#base = 'ÄmenoÖabelsÜ'
puts Q::Base
puts Q::ValidKeys.inspect
encode = Q.encode(base)
decode = Q.decode(encode)
puts("IN:"+base)
puts("EN:"+encode)
puts("DE:"+decode)
