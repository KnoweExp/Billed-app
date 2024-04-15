/**
 * @jest-environment jsdom
 */

import Bills from '../containers/Bills.js';
import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatStatus } from "../app/format.js"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    let billsInstance;
    beforeEach(() => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));


      billsInstance = new Bills({
        document,
        onNavigate: () => { },
        store: {
          bills: () => ({
            list: () => Promise.resolve(bills)
          })
        },
        localStorage: window.localStorage
      });
    });
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then it should fetch bills from mock API GET", async () => {
      const getSpy = jest.spyOn(billsInstance, "getBills");

      await billsInstance.getBills();
      expect(getSpy).toHaveBeenCalled();
      expect(await billsInstance.store.bills().list()).toEqual(bills);
      getSpy.mockRestore();
    });
  });
});

test("Then it should handle an error if date formatting fails", async () => {
  const consoleSpy = jest.spyOn(console, "log");
  const corruptedBills = [
    ...bills,
    { id: "z", date: "not-a-date", status: "pending" }
  ];
  const billsInstance = new Bills({
    document,
    onNavigate: () => { },
    store: {
      bills: () => ({
        list: () => Promise.resolve(corruptedBills)
      })
    },
    localStorage: window.localStorage
  });
  const billsData = await billsInstance.getBills();
  expect(consoleSpy).toHaveBeenCalled();
  expect(billsData.find(bill => bill.id === "z").date).toEqual("not-a-date");
});


test('should call onNavigate with "NewBill" route', () => {
  const onNavigateMock = jest.fn();
  const billsInstance = new Bills({
    document,
    onNavigate: onNavigateMock,
  });

  billsInstance.handleClickNewBill();
  expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
});




describe('formatStatus', () => {
  it('should return "En attente" for the status "pending"', () => {
    const status = 'pending';
    const formattedStatus = formatStatus(status);
    expect(formattedStatus).toEqual('En attente');
  });

  it('should return "Accepté" for the status "accepted"', () => {
    const status = 'accepted';
    const formattedStatus = formatStatus(status);
    expect(formattedStatus).toEqual('Accepté');
  });

  it('should return "Refusé" for the status "refused"', () => {
    const status = 'refused';
    const formattedStatus = formatStatus(status);
    expect(formattedStatus).toEqual('Refused');
  });

});



