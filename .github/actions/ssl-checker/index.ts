//  # Sample index.js (vanilla JS, no build required):
import * as core from "@actions/core";
import fs from "fs";
interface Result {
  domainName: string;
  startDate: Date;
  startDaysAgo: number;
  expireDate: Date;
  expireDaysLeft: number;
}

interface DomainResult {
  domainName: string;
  allResults: Result[];
  latestResult?: Result;
  warning?: Boolean;
}

const mainACM = async () => {
  const data = fs.readFileSync("certificates.json");
  const certs = JSON.parse(data);

  //console.dir({ certs });

  const errors = [];
  const domainResults: Record<string, DomainResult> = {};

  for (const cert of certs.CertificateSummaryList) {
    try {
      const expDate = new Date(cert.NotAfter);
      const expireDate = expDate.toString();
      const remainingDays = Math.floor(
        (expDate - new Date()) / (24 * 60 * 60 * 1000),
      );

      const stDate = new Date(cert.NotBefore);
      const startDate = stDate.toString();
      const daysOld = Math.floor((new Date() - stDate) / (24 * 60 * 60 * 1000));

      if (!Object.keys(domainResults).includes(cert.DomainName)) {
        const domainResult: DomainResult = {
          domainName: cert.DomainName,
          allResults: [],
          latestResult: undefined,
        };
        domainResults[cert.DomainName] = domainResult;
      }

      const result: Result = {
        domainName: cert.DomainName,
        startDate: cert.NotBefore,
        startDaysAgo: daysOld,
        expireDate: cert.NotAfter,
        expireDaysLeft: remainingDays,
      };
      const domainResult = domainResults[cert.DomainName];
      domainResult.allResults.push(result);

      if (result.startDaysAgo < 0) {
        core.warning(
          `Future start date, skipping, ${result.domainName}, ${result.startDate}`,
        );
      }

      if (
        (domainResult.latestResult == null ||
          result.startDaysAgo < domainResult.latestResult.startDaysAgo) &&
        result.startDaysAgo > 0
      ) {
        domainResult.latestResult = result;
      }
    } catch (e) {
      errors.push({ error: e, cert });
      console.error(e);
    }
  }

  Object.keys(domainResults).forEach((domain) => {
    const domainResult = domainResults[domain];
    const latest = domainResult.latestResult;
    //console.log("domain", domain);
    core.info(
      JSON.stringify({ domain, latest, count: domainResult.allResults.length }),
    );
    if (latest?.expireDaysLeft < 10) {
      domainResult.warning = true;
    }
  });

  if (errors.length > 0) {
    core.setFailed("Had errors checking certificates for issues:");
    for (const error of errors) {
      console.dir(error);
    }
  }

  Object.keys(domainResults).forEach((domain) => {
    const domainResult = domainResults[domain];
    const latest = domainResult.latestResult;

    if (domain === "api.simpler.grants.gov") {
      console.dir({ domainResult });
      domainResult.allResults.forEach((result) => {
        console.dir({ result });
      });
    }

    if (domainResult.warning) {
      core.setFailed(`${domain}, ${domainResult.warning}`);
    }
  });
};

mainACM();
