const Image = ({ blok }) => {
  console.log('image', blok)
  return (
  <img src={blok.image_asset.filename}/>
  );
}

export default Image;
