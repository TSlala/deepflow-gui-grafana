
# DeepFlow Topology Panel

The Topology Panel of DeepFlow can be used to display the dependency relationships between services or resources for better analysis and problem-solving, such as analyzing performance bottlenecks, single points of failure, or potential dependency access issues. Next, we will introduce the topology graph in detail.

## Usage of Topology Graph use

![topo_use.png](https://yunshan-guangzhou.oss-cn-beijing.aliyuncs.com/pub/pic/20230407642f82713d0bc.png)

## Panel Options

### Topo Settings

#### Type

- Simple Topo：The system sorts `nodes` and `paths` based on the relationships between services or resources
- Tree Topo：The system arranges nodes in a tree structure based on path access relationships, commonly used for scenarios with fewer nodes and single paths
- Tree Topo With Group：Supports grouping queries for data and dividing nodes in the same group, with group names marked. Simple Topo simple

#### Node tags

- Set tags to be displayed on the topo graph node.

## Simple Topo

![simple_topo.png](https://yunshan-guangzhou.oss-cn-beijing.aliyuncs.com/pub/pic/20230407642f82706192c.png)

Simple Topo consists of `nodes`, `paths`, and some operations:

- Nodes: Represent services or resources, which can be container services, cloud servers, or regions
- Paths: Represent the direction of access to services or resources, indicating the direction of data transmission from `the client` to `the server`
- Operations: Hover or click on nodes or paths
  - Hover: Highlight nodes or paths and provide ToolTip to display relevant information
    - ToolTip: Displays different data based on the location of the mouse hover
      - Nodes: Displays pod names and node types
      - Paths: Displays client names, server names, traffic collection locations, average request time, server exception rate, and average delay
  - Click: Click on nodes or paths to highlight the nodes and related paths, click again to cancel the highlight

## Tree Topo

![tree_topo.png](https://yunshan-guangzhou.oss-cn-beijing.aliyuncs.com/pub/pic/20230407642f826e5270d.png)

Tree Topo consists of nodes, curves, and some operations. Data nodes are displayed in square form, showing the node type and name of the node. The squares with request associations are connected by curves. The operation can refer to the operations of Simple Topo.

## Tree Topo With Group

![tree_topo_with_group.png](https://yunshan-guangzhou.oss-cn-beijing.aliyuncs.com/pub/pic/20230407642f826f39316.png)

Supports grouping queries for data and dividing nodes in the same group, with group names marked. The usage of Tree Topo With Group is similar to that of Tree Topo.

# DeepFlow Tracing Panel

The DeepFlow Tracing Panel visualizes the full-stack call path of distributed links through flame graphs, which can help developers, system operators, and cloud operators quickly identify performance bottlenecks and errors in calls.

```
Note: A part of [DeepFlow](https://deepflow.yunshan.net/community.html), can only work with DeepFlow datasource and use the `Distributed Tracing - Flame` app type.
```

## Feature

The DeepFlow Tracing Panel consists of four parts: Flame Graph, Service List, Request Log, and Related Data. Flame Graph visualizes each service call that occurs during the execution path of a request as a bar, and displays different information for each bar based on the actual call. Clicking on a bar will display the corresponding service, log, and related data in the data panel on the right, helping you quickly analyze program performance. Next, we will provide a detailed explanation of the usage and functions of each part.

![flame.png](https://yunshan-guangzhou.oss-cn-beijing.aliyuncs.com/pub/pic/20230407642f82b251c2e.png)

### Flame Graph

Flame Graph's x-axis is based on time, and its y-axis is based on the depth of the call stack, and displays the order of Span calls from top to bottom. The flame graph consists of multiple bar-shaped bars, each representing a Span, and supports various operations on the bars.

- The composition of a bar: `Icon` + `Call Information` + `Execution Time`
  - Icon: Differentiates Span types
    - A: Application Span, collected through the Opentelemetry protocol, covering business code and framework code
    - S: System Span, collected through eBPF zero-intrusion, covering system calls, application functions (such as HTTPS), API Gateway, and service mesh sidecar
    - N: Network Span, collected through BPF from network traffic, covering container network components such as iptables, ipvs, OvS, and LinuxBridge
  - Call Information: For Application Span and System Span, it displays the `application protocol`, `request type`, `request resource`; for Network Span, it displays `the path statistics position`
  - Length: Expresses the execution time of a Span
- Operations: Supports hover and click
  - Operations: Supports hover and click Hovering over a bar displays the relevant information of the corresponding Span in the form of a tooltip
    - For Application Span and Network Span: `application protocol`, `request type`, `request resource`, `service name`, `duration`
    - For System Span: `application protocol`、`request type`、`request resource`、`service name`、`system language`、`duration`
    - Execution Time: Displays the entire execution time of the Span and the percentage of its own execution time
  - Click: Clicking on a bar highlights itself and its parent Span, and the data panel on the left displays the detailed information of the Span

### Service List

The Service List displays the names of the services called during the request process, the time generated by the service call, and the proportion of time it takes in the entire request time.

- Clicking on a service in the list will highlight the Span that calls this service in the Flame Graph

### Request Log

The Request Log displays the log generated by a single call.

- Clicking on a Span in the Flame Graph displays the log generated by that Span

### Related Data

The Related Data records relevant information that can be traced by the Span, such as traffic collection location, application protocol, request type, request resource, tracid, spanid, parent spanid, system call tracing request id, TCP sequence number, and other data.

- Clicking on a Span in the Flame Graph will display the relevant Span information traced by that Span.
