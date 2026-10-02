/**
 * Normalize a phone number into one canonical format.
 *
 * BillNest uses phone number as the global customer
 * identity.
 *
 * Examples:
 *
 * 9876543210
 * +91 9876543210
 * +919876543210
 * 09876543210
 *
 * All of the above become:
 *
 * +919876543210
 */

export function normalizePhone(
  phone?: string | null,
): string | undefined {
  if (
    phone === undefined ||
    phone === null
  ) {
    return undefined;
  }

  const value = phone.trim();

  if (!value) {
    return undefined;
  }

  /*
   * Keep only digits.
   *
   * This removes:
   *
   * spaces
   * -
   * (
   * )
   * etc.
   */
  const digits = value.replace(
    /\D/g,
    "",
  );

  if (!digits) {
    return undefined;
  }

  /*
   * Indian 10 digit number.
   *
   * 9876543210
   *
   * becomes:
   *
   * +919876543210
   */
  if (
    digits.length === 10
  ) {
    return `+91${digits}`;
  }

  /*
   * Indian number written with
   * leading zero.
   *
   * 09876543210
   *
   * becomes:
   *
   * +919876543210
   */
  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    return `+91${digits.slice(1)}`;
  }

  /*
   * Indian country code without
   * the + symbol.
   *
   * 919876543210
   *
   * becomes:
   *
   * +919876543210
   */
  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return `+${digits}`;
  }

  /*
   * International number.
   *
   * We cannot safely infer another
   * country's country code, so we
   * preserve the digits and add +.
   */
  return `+${digits}`;
}