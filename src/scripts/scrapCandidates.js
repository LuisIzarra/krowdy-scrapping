import { searchSelectors } from "../config/scrapper.config";
import axiosService from "../service/axiosService";
import AxiosService from "../service/axiosService";
import { $$, $ } from "../utils/selectors";
import { waitForScroll, waitForSelector } from "../utils/waitFor";

// eslint-disable-next-line no-unused-vars
async function init() {
  await waitForSelector(searchSelectors.paginateResultsContainer);

  await waitForScroll(100, 100);

  const URLsCandidates = $$(searchSelectors.paginateResultsContainer).map(
    (element) => $(".app-aware-link", element).href
  );

  // eslint-disable-next-line no-undef
  const port = chrome.runtime.connect({ name: "secureChannelScrap" });

  port.postMessage({ URLsCandidates });
}

// eslint-disable-next-line no-unused-vars
async function initV2(keywords = "fullstack", startPaginate = 0) {
  let pagination = startPaginate;
  let urlsCandidates = [];

  do {
    const { included } = await AxiosService.getPaginate10Results(
      keywords,
      pagination
    );

    const nextCandidates =
      included
        ?.filter((includedElement) => includedElement?.trackingUrn)
        .map((filteredIncluded) => {
          const raw = filteredIncluded?.navigationContext?.url;
          const nameCandidate = $(
            `.entity-result__content a[href="${raw}"] span span`
          )?.textContent;
          const experienceCandidate = $(
            "#main > div > div > div:nth-child(2) > ul > li:nth-child(1) > div > div > div.entity-result__content.entity-result__divider.pt3.pb3.t-12.t-black--light > div.mb1 > div.linked-area.flex-1.cursor-pointer > div > div.entity-result__primary-subtitle.t-14.t-black.t-normal"
          ).textContent;
          const [profileVar] = raw.match(/urn.+/) ?? [];
          // const nameCandidate = await axiosService.getProfileInfo(profileVar);
          return {
            raw,
            nameCandidate,
            profileVar: profileVar.replace("miniP", "p").replace("Afs", "Afsd"),
          };
        }) ?? [];

    urlsCandidates = [...urlsCandidates, ...nextCandidates];

    pagination += 10;

    // TO-DO: encontrar el total o el max de paginacion en la res de la query
  } while (pagination < 50);

  // eslint-disable-next-line no-undef
  const port = chrome.runtime.connect({ name: "secureChannelScrapV2" });
  port.postMessage({ urlsCandidates });

  return urlsCandidates;
}

// init();

initV2();
