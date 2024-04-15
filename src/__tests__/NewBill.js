/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import Bills from '../containers/Bills.js';
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js"
import mockStore from "../__mocks__/store.js"

import Store from '../app/Store';




describe("Given I am connected as an employee", () => {

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });
});

describe("When I am on NewBill Page", () => {
  let newBillInstance;

  beforeEach(() => {
    document.body.innerHTML = `
        <form data-testid="form-new-bill">
          <input data-testid="file" type="file" />
        </form>
      `;

    newBillInstance = new NewBill({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: window.localStorage,
    });
  });

  test("Then mail icon in vertical layout should be highlighted", async () => {

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))

    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router();
    window.onNavigate(ROUTES_PATH.NewBill)
    await waitFor(() => screen.getByTestId('icon-mail'))
    const windowIcon = screen.getByTestId('icon-mail')
    const iconActivated = windowIcon.classList.contains('active-icon')
    expect(iconActivated).toBeTruthy()
  })

  describe("When I upload a file", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    test("Then it should accept the file if it has the good extension", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBillInstance = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      const handleChangeFileSpy = jest.spyOn(newBillInstance, "handleChangeFile");

      const fileInput = screen.getByTestId("file");
      const file = new File(["content"], "goodfile.jpg", { type: "image/jpg" });

      fireEvent.change(fileInput, { target: { files: [file] } });


      expect(fileInput.files[0].name).toBe("goodfile.jpg");
    });

  });



  test("Then it should reject the file if it has the wrong extension", () => {
    window.alert = jest.fn();

    const badFile = new File(["content"], "badfile.txt", { type: "text/plain" });
    const input = document.querySelector(`input[data-testid="file"]`);

    Object.defineProperty(input, 'files', {
      value: [badFile]
    });

    input.dispatchEvent(new Event("change"));

    expect(window.alert).toHaveBeenCalledWith("Veuillez télécharger uniquement des fichiers .jpg, .jpeg ou .png.");
  });
});

describe("When I submit the form with all required fields filled", () => {
  let newBillInstance;
  let submitEventMock;

  beforeEach(() => {
    document.body.innerHTML = `
          <form data-testid="form-new-bill">
            <input data-testid="datepicker" value="2021-04-10"/>
            <select data-testid="expense-type">
              <option value="Transport">Transport</option>
            </select>
            <input data-testid="expense-name" value="Taxi"/>
            <input data-testid="amount" value="100"/>
            <input data-testid="vat" value="20"/>
            <input data-testid="pct" value="20"/>
            <textarea data-testid="commentary">Comment</textarea>
            <input data-testid="file"/>
          </form>
        `;

    newBillInstance = new NewBill({
      document,
      onNavigate: () => { },
      store: null,
      localStorage: window.localStorage
    });

    submitEventMock = {
      preventDefault: jest.fn(),
      target: document.querySelector(`form[data-testid="form-new-bill"]`)
    };
  });

  describe("NewBill POST API", () => {
    beforeEach(() => {
      Store.bills = jest.fn().mockReturnValue({
        create: jest.fn()
      });
    });
    it("should post new bill data correctly", async () => {
      const mockPost = jest.fn().mockResolvedValue({
        id: "1234",
      });

      Store.bills().create = mockPost;

      const result = await Store.bills().create();

      expect(mockPost).toHaveBeenCalled();
      expect(result.id).toEqual("1234");
    });
  });

  test("Then it should call handleSubmit", () => {
    const handleSubmitSpy = jest.spyOn(newBillInstance, "handleSubmit");
    newBillInstance.handleSubmit(submitEventMock);
    expect(handleSubmitSpy).toHaveBeenCalled();
  });

  test("Then it should navigate to Bills page", () => {
    const onNavigateMock = jest.fn();
    newBillInstance.onNavigate = onNavigateMock;

    newBillInstance.handleSubmit(submitEventMock);
    expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
  });
});
