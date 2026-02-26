import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type UserRole = {
    #customer;
    #provider;
  };

  type TicketPriority = {
    #low;
    #medium;
    #high;
  };

  type TicketStatus = {
    #open;
    #in_progress;
    #resolved;
    #closed;
  };

  type User = {
    id : Principal.Principal;
    name : Text;
    email : Text;
    role : UserRole;
    createdAt : Time.Time;
  };

  type OldTicket = {
    id : Text;
    customerId : Principal.Principal;
    title : Text;
    description : Text;
    category : Text;
    priority : TicketPriority;
    status : TicketStatus;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type NewTicket = {
    id : Text;
    customerId : Principal.Principal;
    title : Text;
    description : Text;
    moduleName : Text;
    priority : TicketPriority;
    status : TicketStatus;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    attachment : ?Blob;
  };

  type TicketComment = {
    id : Text;
    ticketId : Text;
    authorId : Principal.Principal;
    message : Text;
    createdAt : Time.Time;
  };

  type OldActor = {
    users : Map.Map<Principal.Principal, User>;
    nextTicketId : Nat;
    nextCommentId : Nat;
    tickets : Map.Map<Text, OldTicket>;
    comments : List.List<TicketComment>;
  };

  type NewActor = {
    users : Map.Map<Principal.Principal, User>;
    nextTicketId : Nat;
    nextCommentId : Nat;
    tickets : Map.Map<Text, NewTicket>;
    comments : List.List<TicketComment>;
  };

  public func run(old : OldActor) : NewActor {
    let newTickets = old.tickets.map<Text, OldTicket, NewTicket>(
      func(_id, oldTicket) {
        {
          id = oldTicket.id;
          customerId = oldTicket.customerId;
          title = oldTicket.title;
          description = oldTicket.description;
          moduleName = oldTicket.category; // Transfer old "category" to new "moduleName" field.
          priority = oldTicket.priority;
          status = oldTicket.status;
          createdAt = oldTicket.createdAt;
          updatedAt = oldTicket.updatedAt;
          attachment = null; // Existing tickets won't have attachments post-migration.
        };
      }
    );

    {
      old with
      tickets = newTickets
    };
  };
};
