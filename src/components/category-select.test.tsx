import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategorySelect } from "./category-select";

describe("CategorySelect", () => {
  it("renders all options", () => {
    render(
      <CategorySelect
        id="areaCategoryId"
        name="areaCategoryId"
        label="Area category"
        options={[
          { id: "cat-1", name: "Casa" },
          { id: "cat-2", name: "Alimentacao" },
        ]}
      />,
    );

    const select = screen.getByLabelText("Area category");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[1]).toHaveTextContent("Casa");
    expect(options[2]).toHaveTextContent("Alimentacao");
  });
});
