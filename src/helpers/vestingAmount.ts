import * as Sentry from "@sentry/browser";
import { Coin } from "@cosmjs/proto-signing";
import { defaultChain } from "./utils";
import {
  BASE_ACCOUNT,
  CONTINUOUS_VESTING_ACCOUNT,
  DELAYED_VESTING_ACCOUNT,
  PERIODIC_VESTING_ACCOUNT,
} from "../../appConstants";
import { GetAccount } from "./types";
import { Dec } from "@keplr-wallet/unit";
import { toDec } from "./coin";

const periodicVesting = "/cosmos.vesting.v1beta1.PeriodicVestingAccount";
const baseAccount = "/cosmos.auth.v1beta1.BaseAccount";
const delayedVesting = "/cosmos.vesting.v1beta1.DelayedVestingAccount";
const continuousVesting = "/cosmos.vesting.v1beta1.ContinuousVestingAccount";

function getUTOKEN_Balance(amountList: any) {
  let balance = 0;
  for (let i = 0; i < amountList.length; i++) {
    if (amountList[i].denom === defaultChain.currency.coinMinimalDenom) {
      balance = parseInt(amountList[i].amount);
      break;
    }
  }
  return balance;
}

export const getPeriodicVestingAmount = (
  account: any,
  currentEpochTime: number
) => {
  let accountVestingAmount = getUTOKEN_Balance(
    account.baseVestingAccount.originalVesting
  );
  let freeBalance = 0;
  const endTime = parseInt(account.baseVestingAccount.endTime);
  if (endTime >= currentEpochTime) {
    let vestingTimes = parseInt(account.startTime);
    for (let i = 0; i < account.vestingPeriods.length; i++) {
      let length = parseInt(account.vestingPeriods[i]["length"]);
      vestingTimes = vestingTimes + length;
      if (currentEpochTime >= vestingTimes) {
        freeBalance =
          freeBalance + getUTOKEN_Balance(account.vestingPeriods[i].amount);
      }
    }
  } else {
    accountVestingAmount = 0;
  }
  accountVestingAmount = accountVestingAmount - freeBalance;
  return accountVestingAmount;
};

export const getDelayedVestingAmount = (
  account: any,
  currentEpochTime: number
) => {
  const endTime = parseInt(account.baseVestingAccount.endTime);
  if (endTime >= currentEpochTime) {
    return getUTOKEN_Balance(account.baseVestingAccount.originalVesting);
  } else {
    return 0;
  }
};

export const getContinuousVestingAmount = (
  account: any,
  currentEpochTime: number
) => {
  const endTime = parseInt(account.baseVestingAccount.endTime);
  const startTime = parseInt(account.startTime);
  if (endTime >= currentEpochTime) {
    let originalVestingAmount = getUTOKEN_Balance(
      account.baseVestingAccount.originalVesting
    );
    return (
      (originalVestingAmount * (endTime - currentEpochTime)) /
      (endTime - startTime)
    );
  } else {
    return 0;
  }
};

function getAccountVestingAmount(account: any, currentEpochTime: number) {
  let accountVestingAmount = 0;
  switch (account!.typeUrl) {
    case PERIODIC_VESTING_ACCOUNT:
      accountVestingAmount = getPeriodicVestingAmount(
        account,
        currentEpochTime
      );
      break;
    case DELAYED_VESTING_ACCOUNT:
      accountVestingAmount = getDelayedVestingAmount(account, currentEpochTime);
      break;
    case CONTINUOUS_VESTING_ACCOUNT:
      accountVestingAmount = getContinuousVestingAmount(
        account,
        currentEpochTime
      );
      break;
    case baseAccount:
      accountVestingAmount = 0;
      break;
    default:
  }
  return accountVestingAmount;
}

export const getTransferableAmount = async (
  address: string,
  accountData: any,
  balance: string
) => {
  try {
    const balanceDec = toDec(balance);
    let transferableAmount: Dec;
    console.log(accountData, "accountData231");

    const amount = toDec(accountData.vestingBalance.toString());
    let delegatedVesting = new Dec(0);
    if (accountData.typeUrl !== BASE_ACCOUNT) {
      delegatedVesting = new Dec(
        getDenomAmount(
          accountData.accountData!.baseVestingAccount.delegatedVesting!
        )!
      );
    }
    transferableAmount = balanceDec.add(delegatedVesting.sub(amount));
    if (transferableAmount.lt(new Dec(0))) {
      transferableAmount = new Dec(0);
    }
    if (delegatedVesting.gt(amount)) {
      transferableAmount = balanceDec;
    }
    return transferableAmount;
  } catch (error: any) {
    return new Dec(0);
  }
};

function getDenomAmount(
  coins: Coin[],
  denom = defaultChain.currency.coinMinimalDenom
) {
  if (coins.length > 0) {
    for (let coin of coins) {
      if (coin.denom === denom) {
        return Number(coin.amount);
      }
    }
    return 0;
  } else {
    return 0;
  }
}
