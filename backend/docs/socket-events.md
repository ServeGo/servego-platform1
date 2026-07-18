# ServeGo Socket Event Contract

Sockets are invalidation signals, not database replicas. Every payload is deliberately minimal; clients must refetch the relevant HTTP resource after receiving it.

Authenticate first with `authenticate(token)`. The server assigns the socket to `user:<userId>` and administrators also join `room:admin`. Client-directed `join` and `leave` calls are accepted only for the already-authenticated user ID.

| Event | Audience | Payload |
| --- | --- | --- |
| `booking:created` | booking customer and provider | `{ bookingId }` |
| `booking:statusChanged` | booking customer and provider | `{ bookingId, status }` |
| `booking:cancelled` | booking customer and provider | `{ bookingId, status: 'CANCELLED' }` |
| `booking:messageCreated` | other booking party | `{ bookingId, messageId }` |
| `providerService:approved` | requesting provider | `{ providerServiceRequestId, serviceId }` |
| `providerService:rejected` | requesting provider | `{ providerServiceRequestId }` |
| `category:activeCountChanged` | all connected clients | `{ serviceId }` |
| `notification:new` | notification owner | `{ notificationId, type }` |
| `adminAlert:newServiceRequest` | `room:admin` | `{ providerServiceRequestId }` |
| `adminAlert:newSupportTicket` | `room:admin` | `{ ticketId }` |

Legacy events remain temporarily for existing clients: `newJobLead`, `bookingUpdated`, `bookingStatusChanged`, `notification`, `serviceApproved`, `newApprovalRequest`, `bookingMessage`, and `chatMessageReceived`.
