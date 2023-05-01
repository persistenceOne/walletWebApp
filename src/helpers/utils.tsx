import _ from "lodash";
import * as Sentry from "@sentry/nextjs";
import { Scope } from "@sentry/nextjs";
import { CaptureContext } from "@sentry/types/types/scope";
import { Primitive } from "@sentry/types";
import { displayToast } from "../components/molecules/toast";
import { ToastType } from "../components/molecules/toast/types";
import { Coin } from "@cosmjs/proto-signing";
import {
  DefaultChainInfo,
  ExternalChains,
  FeeInfo,
  IBCChainInfos,
  MainNetFoundationNodes,
  PstakeInfo,
  stkATOMInfo,
  TestNetFoundationNodes,
} from "./config";
import { sha256, stringToPath } from "@cosmjs/crypto";
import { BaseAccount } from "cosmjs-types/cosmos/auth/v1beta1/auth";
import {
  ContinuousVestingAccount,
  DelayedVestingAccount,
  PeriodicVestingAccount,
} from "cosmjs-types/cosmos/vesting/v1beta1/vesting";
import { decryptKeyStore } from "./wallet";
import {
  ENCRYPTED_MNEMONIC,
  LOGIN_INFO,
  PERSISTENCE,
  PERSISTENCE_PREFIX,
} from "../../appConstants";
import { useAppStore } from "../../store/store";
import bech32 from "bech32";
const tendermint = require("cosmjs-types/ibc/lightclients/tendermint/v1/tendermint");
const encoding = require("@cosmjs/encoding");
const bip39 = require("bip39");

const env: string = process.env.NEXT_PUBLIC_ENVIRONMENT!;

export const persistenceChain = ExternalChains[env].find(
  (chain) => chain.bech32Config.bech32PrefixAccAddr === PERSISTENCE_PREFIX
);
console.log(persistenceChain, "persistenceChain", env);

export const defaultChain = DefaultChainInfo[env];
export const ibcChainInfo = IBCChainInfos[env];
const valoperAddressPrefix = defaultChain.prefix;
const addressPrefix = defaultChain.prefix;
const configCoinType = defaultChain.coinType;

export const emptyFunc = () => ({});

export const removeCommas = (str: any) =>
  _.replace(str, new RegExp(",", "g"), "");

const reverseString = (str: any) =>
  removeCommas(_.toString(_.reverse(_.toArray(str))));

const recursiveReverse = (input: any): string => {
  if (_.isArray(input))
    return _.toString(_.reverse(_.map(input, (v: any) => recursiveReverse(v))));
  if (_.isString()) return reverseString(input);
  return reverseString(`${input}`);
};

export const sixDigitsNumber = (value: string, length = 6): string => {
  let inputValue = value.toString();
  if (inputValue.length >= length) {
    return inputValue.substring(0, length);
  } else {
    const stringLength = length - inputValue.length;
    let newString = inputValue;
    for (let i = 0; i < stringLength; i++) {
      newString += "0";
    }
    return newString;
  }
};

export const randomNum = (min: number, max: number) => {
  let randomNumbers = [];
  for (let i = 0; i < 3; i++) {
    let random_number = Math.floor(Math.random() * (max - min) + min);
    if (randomNumbers.indexOf(random_number) === -1) {
      randomNumbers.push(random_number);
    }
  }
  return randomNumbers;
};

export const formatNumber = (v = 0, size = 3, decimalLength = 6): string => {
  let str = `${v}`;
  if (!str) return "NaN";
  let substr = str.split(".");
  if (substr[1] === undefined) {
    let newString = "0";
    for (let i = 1; i < decimalLength; i++) {
      newString += "0";
    }
    substr.push(newString);
  } else {
    substr[1] = sixDigitsNumber(substr[1], decimalLength);
  }
  str = reverseString(substr[0]);
  const regex = `.{1,${size}}`;
  const arr = str.match(new RegExp(regex, "g"));
  return `${recursiveReverse(arr)}${substr[1] ? `.${substr[1]}` : ""}`;
};

export const stringTruncate = (str: string, length = 7): string => {
  if (str.length > 30) {
    return (
      str.substring(0, length) +
      "..." +
      str.substring(str.length - length, str.length)
    );
  }
  return str;
};

export const truncateToFixedDecimalPlaces = (
  num: number | string,
  decimalPlaces = 6
): number => {
  const regexString = "^-?\\d+(?:\\.\\d{0,dp})?";
  const regexToMatch = regexString.replace("dp", `${decimalPlaces}`);
  const regex = new RegExp(regexToMatch);
  const matched = num.toString().match(regex);
  if (matched) {
    return parseFloat(matched[0]);
  }
  return 0;
};

export const numberFormat = (number: any, decPlaces: number) => {
  // 2 decimal places => 100, 3 => 1000, etc
  decPlaces = Math.pow(10, decPlaces);

  const abbrev = ["K", "M", "M", "T"];

  // Go through the array backwards, so we do the largest first
  for (let i = abbrev.length - 1; i >= 0; i--) {
    // Convert array index to "1000", "1000000", etc
    const size = Math.pow(10, (i + 1) * 3);

    // If the number is bigger or equal do the abbreviation
    if (size <= number) {
      // Here, we multiply by decPlaces, round, and then divide by decPlaces.
      // This gives us nice rounding to a particular decimal place.
      number = Math.round((number * decPlaces) / size) / decPlaces;

      // Handle special case where we round up to the next abbreviation
      if (number == 1000 && i < abbrev.length - 1) {
        number = 1;
        i++;
      }

      // Add the letter for the abbreviation
      number += abbrev[i];

      break;
    }
  }

  return number;
};

export const exceptionHandle = (
  e: any,
  sentryTag: { [key: string]: Primitive }
) => {
  displayToast(
    {
      message: e.message
        ? e.message
        : "This transaction could not be completed",
    },
    ToastType.ERROR
  );
  useAppStore
    .getState()
    .setTxnInfo({ inProgress: false, name: null, failed: true });
  const customScope = new Scope();
  customScope.setLevel("fatal");
  customScope.setTags(sentryTag);
  sentryReport(e, customScope);
};

export const sentryReport = (exception: any, context: CaptureContext) => {
  console.log(exception);
  Sentry.captureException(exception, context);
};

export const resetStore = () => {
  useAppStore.getState().resetTxnSlice();
  useAppStore.getState().resetWalletSlice();
  useAppStore.getState().resetCreateWalletSlice();
};

function isActive(item: any) {
  return item.jailed === false && item.status === 3;
}

function checkLastPage(
  pageNumber: number,
  limit: number,
  totalTransactions: number
) {
  return totalTransactions / limit <= pageNumber;
}

export const tokenValueConversion = (data: string) => {
  return Number(data) / defaultChain.uTokenValue;
};

export const denomModify = (amount: Coin) => {
  if (Array.isArray(amount)) {
    if (amount.length) {
      if (amount[0].denom === defaultChain.currency.coinMinimalDenom) {
        return [
          tokenValueConversion(amount[0].amount),
          defaultChain.currency.coinDenom,
        ];
      } else {
        return [amount[0].amount, amount[0].denom];
      }
    } else {
      return "";
    }
  } else {
    if (amount.denom === defaultChain.currency.coinMinimalDenom) {
      return [
        tokenValueConversion(amount.amount),
        defaultChain.currency.coinDenom,
      ];
    } else {
      return [amount.amount, amount.denom];
    }
  }
};

export const getChainFromDenom = (denom: string) => {
  const chains = ExternalChains[env];
  return chains.find((item) => {
    return item!.currencies.find((currency) => {
      return currency.coinMinimalDenom === denom;
    });
  });
};

export const getDenomFromMinimalDenom = (
  denom: string
): { denom: string; tokenImg: string } => {
  switch (denom) {
    case "uxprt":
      return { denom: "XPRT", tokenImg: "/tokens/xprt.png" };
    case "uatom":
      return { denom: "ATOM", tokenImg: "tokens/atom.svg" };
    case PstakeInfo.coinMinimalDenom:
      return { denom: "PSTAKE", tokenImg: "tokens/pstake.png" };
    case "ugraviton":
      return { denom: "GRAVITON", tokenImg: "tokens/grav.svg" };
    case "uosmo":
      return { denom: "OSMO", tokenImg: "tokens/osmo.svg" };
    case stkATOMInfo.coinMinimalDenom:
      return { denom: "STKATOM", tokenImg: "tokens/stkatom.svg" };
    case "arebus":
      return { denom: "REBUS", tokenImg: "tokens/rebus.png" };
    case "aevmos":
      return { denom: "EVMOS", tokenImg: "tokens/evmos.png" };
    case "ucmdx":
      return { denom: "CMDX", tokenImg: "tokens/cmdx.png" };
    case "ucmst":
      return { denom: "CMST", tokenImg: "tokens/cmst.png" };
    default:
      return { denom: "Unknown", tokenImg: "tokens/ibc.svg" };
  }
};

const foundationNodeCheck = (validatorAddress: string) => {
  if (NODE_CONF === "ibcStaging.json") {
    if (TestNetFoundationNodes.includes(validatorAddress)) {
      return true;
    } else {
      return false;
    }
  } else {
    if (MainNetFoundationNodes.includes(validatorAddress)) {
      return true;
    } else {
      return false;
    }
  }
};

export const getAccountNumber = (value: string) => {
  return value === "" ? "0" : value;
};

export const addrToValoper = (address: string) => {
  let data = encoding.fromBech32(address).data;
  return encoding.toBech32(valoperAddressPrefix, data);
};

export const valoperToAddr = (valoperAddr: string) => {
  let data = encoding.fromBech32(valoperAddr).data;
  return encoding.toBech32(addressPrefix, data);
};

export const checkValidatorAccountAddress = (
  validatorAddress: string,
  address: string
) => {
  let validatorAccountAddress = valoperToAddr(validatorAddress);
  return validatorAccountAddress === address;
};

/**
 * @return {boolean}
 */
export const vestingAccountCheck = async (type: string) => {
  return (
    type === "/cosmos.vesting.v1beta1.PeriodicVestingAccount" ||
    type === "/cosmos.vesting.v1beta1.DelayedVestingAccount" ||
    type === "/cosmos.vesting.v1beta1.ContinuousVestingAccount"
  );
};

export const generateHash = (txBytes: Uint8Array) => {
  return encoding.toHex(sha256(txBytes)).toUpperCase();
};

export const mnemonicTrim = (mnemonic: string) => {
  let mnemonicList = mnemonic.replace(/\s/g, " ").split(/\s/g);
  let mnemonicWords: any = [];
  for (let word of mnemonicList) {
    if (word === "") {
      console.log();
    } else {
      let trimmedWord = word.replace(/\s/g, "");
      mnemonicWords.push(trimmedWord);
    }
  }
  mnemonicWords = mnemonicWords.join(" ");
  return mnemonicWords;
};

export const validateMnemonic = (mnemonic: string) => {
  const mnemonicWords = mnemonicTrim(mnemonic);
  return bip39.validateMnemonic(mnemonicWords);
};

export const fileTypeCheck = (filePath: string) => {
  let allowedExtensions = /(\.json)$/i;
  return allowedExtensions.exec(filePath);
};

export const downloadFile = async (jsonContent: any) => {
  const json = jsonContent;
  const fileName = "KeyStore";
  const blob = new Blob([json], { type: "application/json" });
  const href = await URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName + ".json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const validateAddress = (bech32Address: string, prefix?: string) => {
  try {
    const { prefix: decodedPrefix } = bech32.decode(bech32Address);
    console.log(prefix, "decodedPrefix", decodedPrefix);
    return !!(prefix && prefix === decodedPrefix);
  } catch (e) {
    console.log(e, "error decodedPrefix");
    return false;
  }
};

export const updateFee = (address: string) => {
  const loginInfo = JSON.parse(localStorage.getItem(LOGIN_INFO)!);
  if (loginInfo && loginInfo.loginMode === "normal") {
    getAccount(address)
      .then(async (res) => {
        const accountType = await vestingAccountCheck(res!.typeUrl);
        if (accountType) {
          loginInfo.fee = FeeInfo.vestingAccountFee;
          loginInfo.account = "vesting";
        } else {
          loginInfo.fee = FeeInfo.defaultFee;
          loginInfo.account = "non-vesting";
        }
      })
      .catch((error) => {
        Sentry.captureException(
          error.response ? error.response.data.message : error.message
        );
        console.log(error.message);
        loginInfo.fee = FeeInfo.defaultFee;
        loginInfo.account = "non-vesting";
      });
    localStorage.setItem(LOGIN_INFO, JSON.stringify(loginInfo));
  } else {
    loginInfo.fee = FeeInfo.vestingAccountFee;
    localStorage.setItem(LOGIN_INFO, JSON.stringify(loginInfo));
  }
};

export const privateKeyReader = (
  file: Blob,
  password: any,
  loginAddress: string,
  accountNumber = "0",
  addressIndex = "0",
  bip39PassPhrase = "",
  coinType = configCoinType
) => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = async (event) => {
      if (event.target!.result !== "") {
        const res = JSON.parse(event.target!.result);
        const decryptedData = decryptKeyStore(res, password);
        if (decryptedData.error != null) {
          reject(new Error(decryptedData.error));
        } else {
          let mnemonic = mnemonicTrim(decryptedData.mnemonic);
          const accountData = await transactions.MnemonicWalletWithPassphrase(
            mnemonic,
            makeHdPath(accountNumber, addressIndex, coinType),
            bip39PassPhrase
          );
          const address = accountData[1];
          if (address === loginAddress) {
            resolve(mnemonic);
            localStorage.setItem(ENCRYPTED_MNEMONIC, event.target!.result);
          } else {
            reject(
              new Error(
                "Your sign in address and keystore file don’t match. Please try again or else sign in again."
              )
            );
          }
        }
      } else {
        reject(new Error("Invalid File data"));
      }
    };
  });
};

export const makeHdPath = (
  accountNumber = "0",
  addressIndex = "0",
  coinType = 118
) => {
  return stringToPath(
    "m/44'/" + coinType + "'/" + accountNumber + "'/0/" + addressIndex
  );
};

export const getAccountNumberAndSequence = (authResponse: any) => {
  if (
    authResponse.account["@type"] ===
    "/cosmos.vesting.v1beta1.PeriodicVestingAccount"
  ) {
    return [
      authResponse.account.base_vesting_account.base_account.account_number,
      authResponse.account.base_vesting_account.base_account.sequence,
    ];
  } else if (
    authResponse.account["@type"] ===
    "/cosmos.vesting.v1beta1.DelayedVestingAccount"
  ) {
    return [
      authResponse.account.base_vesting_account.base_account.account_number,
      authResponse.account.base_vesting_account.base_account.sequence,
    ];
  } else if (
    authResponse.account["@type"] ===
    "/cosmos.vesting.v1beta1.ContinuousVestingAccount"
  ) {
    return [
      authResponse.account.base_vesting_account.base_account.account_number,
      authResponse.account.base_vesting_account.base_account.sequence,
    ];
  } else if (
    authResponse.account["@type"] === "/cosmos.auth.v1beta1.BaseAccount"
  ) {
    return [authResponse.account.account_number, authResponse.account.sequence];
  } else {
    return [-1, -1];
  }
};

export const decodeTendermintClientStateAny = (clientState: any) => {
  if (
    (clientState === null || clientState === void 0
      ? void 0
      : clientState.typeUrl) !== "/ibc.lightclients.tendermint.v1.ClientState"
  ) {
    throw new Error(
      `Unexpected client state type: ${
        clientState === null || clientState === void 0
          ? void 0
          : clientState.typeUrl
      }`
    );
  }
  return tendermint.ClientState.decode(clientState.value!);
};

// copied from node_modules/@cosmjs/stargate/build/queries/ibc.js
export const decodeTendermintConsensusStateAny = (consensusState: any) => {
  if (
    (consensusState === null || consensusState === void 0
      ? void 0
      : consensusState.typeUrl) !==
    "/ibc.lightclients.tendermint.v1.ConsensusState"
  ) {
    throw new Error(
      `Unexpected client state type: ${
        consensusState === null || consensusState === void 0
          ? void 0
          : consensusState.typeUrl
      }`
    );
  }
  return tendermint.ConsensusState.decode(consensusState.value);
};

export const getChain = (chainId: string) => {
  return ExternalChains[env].find((chain) => chain.chainId === chainId);
};
