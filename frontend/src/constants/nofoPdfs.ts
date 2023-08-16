export type pdf = {
  file: string; // path to file in public directory
  image: string; // path to image in public directory
  alt: string; // key for translation in i18n json file
};

export const nofoPdfs: pdf[] = [
  {
    file: "/docs/acl_prototype.pdf",
    image: "/img/acl_prototype.png",
    alt: "acl_prototype",
  },
  {
    file: "/docs/acf_prototype.pdf",
    image: "/img/acf_prototype.png",
    alt: "acf_prototype",
  },
  {
    file: "/docs/cdc_prototype.pdf",
    image: "/img/cdc_prototype.png",
    alt: "cdc_prototype",
  },
  {
    file: "/docs/samhsa_prototype.pdf",
    image: "/img/samhsa_prototype.png",
    alt: "samhsa_prototype",
  },
];
