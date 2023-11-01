export type pdf = {
  file: string; // path to file in public directory
  image: string; // path to image in public directory
  alt: string; // key for translation in i18n json file
  height: number; // pixel height of the image
  width: number; // pixel width of the image
};

export const nofoPdfs: pdf[] = [
  {
    file: "/docs/acl_prototype.pdf",
    image: "/img/acl_prototype.png",
    alt: "acl_prototype",
    height: 1290,
    width: 980,
  },
  {
    file: "/docs/cdc_prototype.pdf",
    image: "/img/cdc_prototype.png",
    alt: "cdc_prototype",
    height: 980,
    width: 1290,
  },
  {
    file: "/docs/acf_prototype.pdf",
    image: "/img/acf_prototype.png",
    alt: "acf_prototype",
    height: 1290,
    width: 980,
  },
  {
    file: "/docs/samhsa_prototype.pdf",
    image: "/img/samhsa_prototype.png",
    alt: "samhsa_prototype",
    height: 980,
    width: 1290,
  },
];
