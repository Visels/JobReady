export const REFERRAL_REWARD_RATE = 0.2;
export const REFERRAL_REWARD_LABEL = "20% of their first paid checkout";

export function buildReferralLink(siteUrl: string, referrerId: string) {
  const url = new URL("/login", `${siteUrl}/`);
  url.searchParams.set("ref", referrerId);
  url.searchParams.set("callbackUrl", "/dashboard");
  return url.toString();
}

export function referralRewardAmount(amount: number) {
  return Math.floor(amount * REFERRAL_REWARD_RATE);
}

export function formatMinorCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
