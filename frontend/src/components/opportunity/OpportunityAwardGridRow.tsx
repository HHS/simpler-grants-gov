type Props = {
  title: string | number;
  content: string | number;
};

const OpportunityAwardGridRow = ({ title, content }: Props) => {
  return (
    <div className="border radius-md border-base-lighter padding-x-2  ">
      <p className="font-sans-sm text-bold margin-bottom-0">{content}</p>
      <p className="desktop-lg:font-sans-sm margin-top-0">{title}</p>
    </div>
  );
};

export default OpportunityAwardGridRow;
