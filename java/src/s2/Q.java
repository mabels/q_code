package s2;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 * Q-Code Port to Java.
 * 
 * @author marwol
 */
public class Q {

	/**
	 * Returns a Q-Code encoded string.
	 * 
	 * @param in
	 *            Input to encode
	 * @return encoded result
	 */
	public static final String encode(String in) {
		List<String> out = new ArrayList<String>();
		out.add("!");
		int len = in.length();
		int idx = 1;
		for (int i = 0; i < len; ++i) {
			char c = in.charAt(i);
			int num = (int) c;
			if (Implementation.validKeys[num] != null) {
				out.add("" + c);
				idx++;
			} else {
				idx = Implementation.encode0(num, out, idx);
			}
		}
		return Implementation.join(out);
	}

	/**
	 * Returns a Q-Code decoded string.
	 * 
	 * @param hash
	 *            Encoded input
	 * @return decoded result
	 */
	public static final String decode(String hash) {
		if (hash.charAt(0) != '!') {
			throw new RuntimeException("Illegal Q-Code:" + hash);
		}

		int len = hash.length();
		List<String> out = new ArrayList<String>();
		for (int i = 1; i < len; ++i) {
			char c = hash.charAt(i);
			if (Implementation.validKeys[(int) c] == null) {
				Implementation.DecodeResult ret = Implementation.decode0(hash
						.substring(i, i + 5 < len ? i + 5 : len));
				out.add(ret.decoded);
				i += ret.len - 1; // q/Q read before
			} else {
				out.add("" + c);
			}

		}
		return Implementation.join(out);
	}

	private static final class Implementation {

		private static final Character[] validKeys;
		static {
			Map<Integer, Character> _validKeys = new HashMap<Integer, Character>();
			for (int i = (int) ' '; i <= (int) '~'; ++i) {
				_validKeys.put(i, (char) i);
			}
			// add exception
			_validKeys.remove((int) '~'); // 8Bit Encoder
			_validKeys.remove((int) ' '); // 8Bit Encoder
			_validKeys.remove((int) 'q'); // 8Bit Encoder
			_validKeys.remove((int) 'Q'); // 16Bit Encoder

			validKeys = new Character[255];
			for (Entry<Integer, Character> entry : _validKeys.entrySet()) {
				validKeys[entry.getKey()] = entry.getValue();
			}
		}

		private static final Map<Integer, CountObject> countMap;
		static {
			countMap = new HashMap<Integer, CountObject>();
			Map<Integer, Integer> types = new HashMap<Integer, Integer>();
			types.put(0, 9);/* \t */
			types.put(1, 10);/* \r */
			types.put(2, 13);/* \n */
			types.put(3, 32);/* SPC */
			types.put(4, 63);/* ? */

			Map<Character, List<String>> decoded = new HashMap<Character, List<String>>();
			String bases = "0AaLl";
			for (int i = bases.length() - 1; i >= 0; --i) {
				decoded.put(
						bases.charAt(i),
						new ArrayList<String>(Arrays.asList(""
								+ (char) types.get(i).intValue())));
			}
			for (int i = 0; i < 10; ++i) {
				for (int j = 0; j < 5; ++j) {
					int base = (int) bases.charAt(j) + i;
					countMap.put(
							base,
							new CountObject(i + 1, "~" + (char) base,
									join(decoded.get(bases.charAt(j))), types
											.get(j)));
					decoded.get(bases.charAt(j)).add(
							decoded.get(bases.charAt(j)).get(0));
				}
			}
		}

		private static final class CountObject {
			int value;
			String encode;
			String decode;
			int type;

			public CountObject(int value, String encode, String decode, int type) {
				this.value = value;
				this.encode = encode;
				this.decode = decode;
				this.type = type;
			}
		}

		private static final class DecodeResult {
			String decoded;
			int len;

			public DecodeResult(String decoded, int len) {
				this.decoded = decoded;
				this.len = len;
			}
		}

		private static final char[] radix = { 'A', 'B', 'C', 'D', 'E', 'F',
				'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P' };

		private static final String numInit(int ascii) {
			switch (ascii) {
			case 9:
				return "~0";
			case 10:
				return "~A";
			case 13:
				return "~a";
			case 32:
				return "~L";
			case 63:
				return "~?";
			}
			return null;
		}

		private static final int encode0(int ascii, List<String> out, int idx) {
			// 113 = "q".charCodeAt(0)
			// 81 = "Q".charCodeAt(0)
			if (numInit(ascii) != null) {
				String tmp = out.get(idx - 1);
				if (tmp.length() == 2 && ((int) tmp.charAt(0)) == 126) {
					int count = (int) tmp.charAt(1);
					CountObject tmpObj = countMap.get(count);
					if (tmpObj.type == ascii && tmpObj.value < 10) {
						out.set(idx - 1, countMap.get(count + 1).encode);
						return idx;
					}
				}
				out.add(numInit(ascii));
				return ++idx;
			}

			if (ascii == 113) {
				out.add("qq");
				return ++idx;
			}
			if (ascii == 81) {
				out.add("QQ");
				return ++idx;
			}
			if (ascii == 126) {
				out.add("~~");
				return ++idx;
			} /* _ */
			if (ascii < 0x100) {
				out.add("q" + radix[(ascii >> 4) & 0xf]
						+ radix[(ascii >> 0) & 0xf]);
				return ++idx;
			}
			out.add("Q" + radix[(ascii >> 12) & 0xf]
					+ radix[(ascii >> 8) & 0xf] + radix[(ascii >> 4) & 0xf]
					+ radix[(ascii >> 0) & 0xf]);
			return ++idx;
		}

		private static final DecodeResult decode0(String str) {
			String qq = str.substring(0, 2);
			if (qq.equals("qq")) {
				return new DecodeResult("q", 2);
			}
			if (qq.equals("QQ")) {
				return new DecodeResult("Q", 2);
			}
			if (qq.equals("~~")) {
				return new DecodeResult("~", 2);
			}
			char mode = qq.charAt(0);
			if (mode == '~') {
				return new DecodeResult(
						countMap.get((int) qq.charAt(1)).decode, 2);
			}
			str = str.toUpperCase(); // work save with the base
			char base = ("A").charAt(0);
			if (mode == 'Q') {
				return new DecodeResult(
						""
								+ (char) (((str.charAt(1) - base) << 12)
										| ((str.charAt(2) - base) << 8)
										| ((str.charAt(3) - base) << 4) | ((str
										.charAt(4) - base) << 0)),
						5);
			}
			if (mode == 'q') {
				return new DecodeResult(
						""
								+ (char) ((str.charAt(1) - base) << 4 | (str
										.charAt(2) - base)),
						3);
			}
			return new DecodeResult(str, str.length());
		}

		private static final String join(List<String> list) {
			StringBuilder sb = new StringBuilder();
			for (String part : list) {
				sb.append(part);
			}
			return sb.toString();
		}

	}

	// public static void main(String... args) throws Exception {
	// String base =
	// "{ÄmenoqgiesbertQabelsÜ%:\"meno\", meno: { all: \"meno\" }}";
	// System.out.println(base);
	// String encode = Q.encode(base);
	// System.out.println(encode);
	// String decode = Q.decode(encode);
	// System.out.println(decode);
	// if (!base.equals(decode)) {
	// throw new Exception("FAIL");
	// }
	// }

}
