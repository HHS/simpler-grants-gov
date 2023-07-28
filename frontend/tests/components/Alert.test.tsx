import { render, screen } from "@testing-library/react";

import Alert from "src/components/Alert";

describe("Alert", () => {
    it("Renders without errors", () => {
        render(
            <Alert type="success" >
                This is a test
            </Alert>
        );
        const alert = screen.getByTestId('alert')
        expect(alert).toBeInTheDocument();
    })

    it("Renders children content in a <p> tag", () => {
        render(
            <Alert type="success" >
                This is a test
            </Alert>
        );
        const alert = screen.getByTestId('alert')
        expect(alert).toHaveTextContent("This is a test")
        expect(alert).toContainHTML('p')
    })

});
