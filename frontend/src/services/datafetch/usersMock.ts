export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  sayHello: () => void;
}

export const usersMock: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phoneNumber: "555-1234",
    sayHello: () => console.log("Hello, Alice!"),
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob.smith@example.com",
    phoneNumber: "555-2345",
    sayHello: () => console.log("Hello, Bob!"),
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol.williams@example.com",
    phoneNumber: "555-3456",
    sayHello: () => console.log("Hello, Carol!"),
  },
  {
    id: 4,
    name: "Dave Brown",
    email: "dave.brown@example.com",
    sayHello: () => console.log("Hello, Dave!"),
  },
  {
    id: 5,
    name: "Eve Davis",
    email: "eve.davis@example.com",
    phoneNumber: "555-4567",
    sayHello: () => console.log("Hello, Eve!"),
  },
];
