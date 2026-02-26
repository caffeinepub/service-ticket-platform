import List "mo:core/List";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import BlobStorage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  public type UserRole = {
    #customer;
    #provider;
  };

  public type TicketPriority = {
    #low;
    #medium;
    #high;
  };

  public type TicketStatus = {
    #open;
    #in_progress;
    #resolved;
    #closed;
  };

  public type User = {
    id : Principal;
    name : Text;
    email : Text;
    role : UserRole;
    createdAt : Time.Time;
  };

  public type Ticket = {
    id : Text;
    customerId : Principal;
    title : Text;
    description : Text;
    moduleName : Text;
    priority : TicketPriority;
    status : TicketStatus;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    attachment : ?BlobStorage.ExternalBlob;
  };

  public type TicketComment = {
    id : Text;
    ticketId : Text;
    authorId : Principal;
    message : Text;
    createdAt : Time.Time;
  };

  let users = Map.empty<Principal, User>();
  var nextTicketId = 0;
  var nextCommentId = 0;
  let tickets = Map.empty<Text, Ticket>();
  let comments = List.empty<TicketComment>();

  public shared ({ caller }) func createUser(name : Text, email : Text, role : UserRole) : async () {
    if (users.containsKey(caller)) { Runtime.trap("User already exists") };

    let newUser : User = {
      id = caller;
      name;
      email;
      role;
      createdAt = Time.now();
    };

    users.add(caller, newUser);
  };

  public query func getUser(userId : Principal) : async User {
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) { user };
    };
  };

  public shared ({ caller }) func createTicket(
    title : Text,
    description : Text,
    moduleName : Text,
    priority : TicketPriority,
    attachment : ?BlobStorage.ExternalBlob,
  ) : async Text {
    let newTicketId = nextTicketId.toText();
    nextTicketId += 1;

    let newTicket : Ticket = {
      id = newTicketId;
      customerId = caller;
      title;
      description;
      moduleName;
      priority;
      status = #open;
      createdAt = Time.now();
      updatedAt = Time.now();
      attachment;
    };

    tickets.add(newTicketId, newTicket);
    newTicketId;
  };

  public query ({ caller }) func getTicketsByCustomer() : async [Ticket] {
    tickets.values().toArray().filter(func(ticket) { ticket.customerId == caller });
  };

  public query ({ caller }) func getAllTickets() : async [Ticket] {
    tickets.values().toArray();
  };

  public shared ({ caller }) func updateTicketStatus(ticketId : Text, newStatus : TicketStatus) : async () {
    switch (tickets.get(ticketId)) {
      case (null) { Runtime.trap("Ticket does not exist") };
      case (?ticket) {
        let updatedTicket : Ticket = {
          id = ticket.id;
          customerId = ticket.customerId;
          title = ticket.title;
          description = ticket.description;
          moduleName = ticket.moduleName;
          priority = ticket.priority;
          status = newStatus;
          createdAt = ticket.createdAt;
          updatedAt = Time.now();
          attachment = ticket.attachment;
        };
        tickets.add(ticketId, updatedTicket);
      };
    };
  };

  public shared ({ caller }) func addComment(ticketId : Text, message : Text) : async () {
    let newCommentId = nextCommentId.toText();
    nextCommentId += 1;

    let newComment : TicketComment = {
      id = newCommentId;
      ticketId;
      authorId = caller;
      message;
      createdAt = Time.now();
    };

    comments.add(newComment);
  };

  public query func getCommentsByTicket(ticketId : Text) : async [TicketComment] {
    comments.toArray().filter(func(comment) { comment.ticketId == ticketId });
  };
};
