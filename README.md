
### Vagon.io Streams API Client

## Overview

This is a client implementation for the [Vagon.io Streams API](https://docs.vagon.io/streams/integrations/streams-api-services). It provides a simple way to interact with the Streams API for managing applications, streams, visitor data, and stream machines.
  
## Features
- List applications
- List streams
- Manage stream capacities
- Monitor visitor sessions
- Start, assign, and stop stream machines

## Installation

```sh
npm install vagonstreamsapi
```

## Example usage
```js
import VagonStreamsAPI from 'vagonstreamsapi';
const api = new VagonStreamsAPI({api_key: 'key', api_secret: 'secret'});
const res = await api.application_list();
console.log(res.applications)
```

## Missing
* Proper tests are not implemented
* Not all datatypes are mapped properly in definions 
