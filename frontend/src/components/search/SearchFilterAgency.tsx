import { FilterOption, SearchFilter } from "src/components/search/SearchFilter";

export default function SearchFilterAgency() {
  const filterOptions: FilterOption[] = [
    {
      id: "ASD",
      label: "Alphabet Soup Depertment",
      value: "foo",
    },
    {
      id: "DOS",
      label: "Department of Subdepartments",
      value: "bar",
      children: [
        {
          id: "S1",
          label: "Subdepartment One",
          value: "sub 1",
        },
        {
          id: "S2",
          label: "Subdepartment Two",
          value: "sub 2",
        },
      ],
    },
    {
      id: "APA",
      label: "Another Parent Agency",
      value: "apa",
      children: [
        {
          id: "3b",
          label: "The First Child Agency",
          value: "3a",
        },
        {
          id: "3b",
          label: "Child Agency Number Two",
          value: "3b",
        },
      ],
    },
    {
      id: "4",
      label: "One More Really Long Agency Name That Wraps To Multiple Lines",
      value: "4",
    },
  ];

  return <SearchFilter filterOptions={filterOptions} title="Agency" />;
}
