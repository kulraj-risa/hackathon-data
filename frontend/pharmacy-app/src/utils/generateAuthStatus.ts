import { OrderStatus } from "../enums/authStatus";

export const generateAuthStatus = (currentStatus: string) => {
  switch (currentStatus) {
    case "A1":
      return OrderStatus.Approved;
    case "A2":
      return OrderStatus.PartiallyApproved;
    case "A3":
      return OrderStatus.Denied;
    case "A4":
      return OrderStatus.Inprogress;
    case "A6":
      return OrderStatus.Pending;
    case "C":
      return OrderStatus.Closed;
    case "CT":
      return OrderStatus.Pending;
    case "NA":
      return OrderStatus.Closed;
    case "51":
      return "Complete";
    case "71":
      return OrderStatus.Closed;
    case "WRP":
      return OrderStatus.Inprogress;
    case "NEW":
      return OrderStatus.New;
    case "DFT":
      return OrderStatus.Drafts;
    case "SUB":
      return OrderStatus.Submitted;
    case "ERR":
      return OrderStatus.Error;
    case "REC":
      return OrderStatus.Received;
    default:
      return currentStatus;
  }
};
