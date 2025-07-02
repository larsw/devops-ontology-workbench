# DevOps Infrastructure Ontologies

This directory contains the complete set of ontologies from the DevOps Infrastructure Ontology Network developed jointly by the **Ontology Engineering Group (OEG)** at Universidad Politécnica de Madrid and **Huawei Research Ireland**.

## Source

All ontologies were downloaded from the official DevOps Infrastructure Ontology Catalogue:
- **Main Catalogue**: https://oeg-upm.github.io/devops-infra/index.html
- **Download Date**: July 2, 2025
- **W3ID Namespace**: https://w3id.org/devops-infra/

## Ontology Files

| File | Ontology | Description | Size |
|------|----------|-------------|------|
| `core.ttl` | Core Ontology | Core ontology for the whole network, defines general concepts of Resource and Resource Groups | 14.9 KB |
| `organisation.ttl` | Organisation Ontology | Describes organisational aspects of the DevOps infrastructure | 16.2 KB |
| `business-product.ttl` | Business Product Ontology | Defines business offerings including services and microservices | 34.3 KB |
| `data-center.ttl` | Data Center Ontology | Describes data center characteristics and interconnections | 29.7 KB |
| `server-infrastructure.ttl` | Server Infrastructure Ontology | Describes virtual and physical servers in infrastructure context | 38.0 KB |
| `network-infrastructure.ttl` | Network Infrastructure Ontology | Covers networks, IP addresses, domains, DNS, firewalls | 23.3 KB |
| `software.ttl` | Software Ontology | Describes software items, files, packages, patches, and directories | 18.9 KB |
| `database.ttl` | Database Ontology | Covers databases, instances, replicas, big tables | 30.3 KB |
| `hardware.ttl` | Hardware Ontology | Describes hardware infrastructure: frames, switches, netcards | 22.9 KB |
| `certificate.ttl` | Certificate Ontology | Information about security certificates (SSL, CFCA) | 31.3 KB |
| `workflow.ttl` | Workflow Ontology | Describes workflows and actions for DevOps operations | 20.6 KB |

**Total Size**: ~280 KB

## License

All ontologies are licensed under **Creative Commons Attribution 4.0 International (CC-BY 4.0)**:
- **License URL**: https://creativecommons.org/licenses/by/4.0
- **Rights**: You are free to share, adapt, and use for any purpose, including commercial
- **Requirements**: Attribution must be given to the original creators

## Creators and Contributors

The ontologies were developed by:

### Universidad Politécnica de Madrid (Ontology Engineering Group - OEG)
- David Chaves-Fraga
- Jhon Toledo  
- Julián Arenas-Guerrero
- Oscar Corcho
- Raúl Alcázar

### Huawei Research Ireland
- Hu Peng
- José Mora
- Mingxue Wang
- Nicholas Burrett
- Puchao Zhang

## Technical Information

### Format
- **Serialization**: Turtle (TTL) format - proper native Turtle syntax
- **Content Negotiation**: Downloaded using `Accept: text/turtle` header
- **Ontology Language**: OWL 2
- **Version**: 1.0.0
- **Issue Date**: 2021-02-17

### Namespaces
- **Base URI**: `http://w3id.org/devops-infra/`
- **Core Namespace**: `http://w3id.org/devops-infra/core#`
- **Preferred Prefix**: `devopscore` (for core), similar patterns for others

### Dependencies
The ontologies use standard semantic web vocabularies:
- OWL 2 (`http://www.w3.org/2002/07/owl#`)
- RDF Schema (`http://www.w3.org/2000/01/rdf-schema#`)
- Dublin Core Terms (`http://purl.org/dc/terms/`)
- VANN Vocabulary (`http://purl.org/vocab/vann/`)

## Usage

These ontologies can be used for:
1. **Knowledge Representation**: Modeling DevOps infrastructure components
2. **Data Integration**: Standardizing DevOps infrastructure data
3. **SPARQL Querying**: Semantic queries over infrastructure data
4. **Reasoning**: Inferencing over infrastructure relationships
5. **Application Development**: Building DevOps-aware applications

### Loading in RDF Tools

```turtle
# Example: Load core ontology
@prefix devopscore: <http://w3id.org/devops-infra/core#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .

# Import the ontology
<> owl:imports <http://w3id.org/devops-infra/core> .
```

### SPARQL Endpoint Integration

These ontologies can be loaded into SPARQL endpoints like:
- Apache Jena Fuseki
- Blazegraph
- GraphDB
- Virtuoso

## Maintenance

To update the ontologies:

```bash
# Navigate to ontologies directory
cd backend/ontologies

# Download latest versions using proper content negotiation
curl -L -H "Accept: text/turtle" -o core.ttl "https://w3id.org/devops-infra/core"
curl -L -H "Accept: text/turtle" -o organisation.ttl "https://w3id.org/devops-infra/organisation"
# ... (repeat for all ontologies)
```

## Related Resources

- **Conceptual View**: https://oeg-upm.github.io/devops-infra/conceptualview.html
- **SKOS Codelists**: https://oeg-upm.github.io/devops-infra/skos.html
- **OEG Homepage**: https://oeg.fi.upm.es/
- **GitHub Repository**: https://github.com/oeg-upm/devops-infra

## Citation

When using these ontologies, please cite:

```bibtex
@misc{devops-infra-ontologies,
  title={DevOps Infrastructure Ontology Network},
  author={Chaves-Fraga, David and Toledo, Jhon and Arenas-Guerrero, Julián and 
          Corcho, Oscar and Alcázar, Raúl and Peng, Hu and Mora, José and 
          Wang, Mingxue and Burrett, Nicholas and Zhang, Puchao},
  year={2021},
  publisher={Ontology Engineering Group, Universidad Politécnica de Madrid and Huawei Research Ireland},
  url={https://w3id.org/devops-infra/},
  note={Licensed under CC-BY 4.0}
}
```

---

**Last Updated**: July 2, 2025  
**Source Verification**: All files verified against official W3ID redirects  
**Integrity**: All downloads completed successfully with expected file sizes
