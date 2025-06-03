# YugabyteDB Sizing caluclator

## Summary
"This calculator is intented to help customers provide sizing guidance their YugabyteDB clusters/universes.   It uses known guidance provided by the YugabyteDB documentation located here (https://docs.yugabyte.com/stable/deploy/checklist/) and additional knowledge by YugabyteDB Solutions Engineering and Product Development.  The calculator provides details of the amount and sizing of the compute, including CPU, Memory and Storage requirements.    Additionally it takes into account the desired fault domain topology and the replication factor to include for compute.
"

## Instructions
1. Go to "Calculator" tab, right click on it and select "Duplicate".
2. On the new tab labelled "Copy of Calculator", right click on it and pick "Rename".  Give it a new name for the workload you are sizing.
3. Fill out values for questions 1 - 15 in the top section

## Assumptions
Sizing estimate is biased to prioritize a lower number of nodes over a smaller core size/node.   Once the core limit is met ("Max cores/vCPUs per node" value in input 10) then this value is used by default for the cores/node count. 

## Caveats
This is for "ballpark" or rough estimates only.   It is recommended to vet the sizing with proper testing and benchmarking of a workload that simulates a "real world" situation.
This sizing calculator currently supports YSQL only.   
Improper sizing can impact latency and throughput performance, but its also strongly recommended to have properly designed data structures, query definitions and to leverage tuning practices.

## Upcoming Features to Add to Sizing Calculator
Memory sizing guidance
Azure/AWS/On-premises compute types recommendations based on sizing.
Average indexes per table
Consideration for row/record sizes and record counts.

