# RandApp Reliability & Safety

`src/reliability/` contiene i moduli di affidabilità realmente usati dall'app. Supabase (membership, grant/RLS, controlli server-side) resta sempre l'autorità finale: questi moduli prevengono operazioni invalide o ambigue prima degli effetti di rete, non sostituiscono l'autorizzazione del database.

| Modulo | Responsabilità | Documento |
| --- | --- | --- |
| `validation-engine.js`, `domain-validation.js` | Validazione dichiarativa e regole di dominio (Planning, Magazzino). Nessuna dipendenza esterna. | `VALIDATION_LAYER.md` |
| `safe-write-engine.js` | Scritture con id di mutazione, controllo di conflitto e retry controllato. | `SAFE_WRITE_ENGINE.md` |
| `offline-concurrency.js` | Lease, id operazione, backoff e validazione dell'outbox offline con `hotel_id`. | `OFFLINE_RETRY_CONCURRENCY.md` |
| `jwt-errors.js`, `jwt-clock-recovery.js`, `jwt-network-recovery.js` | Riconoscimento e recupero degli errori JWT da clock skew (`PGRST303`), attesa dell'accettazione REST dopo il login, rinnovo limitato delle sole GET/HEAD. | README, sezione Login |

## Principi

- Deny-by-default quando manca il contesto richiesto (hotel, attore, risorsa).
- Nessun dato di credenziali, PIN o token nei contesti di telemetria o nei log.
- Non introdurre un secondo runtime di policy o di workflow: la scala attuale non lo giustifica.
- Un fetch fallito non diventa mai un falso "vuoto": le liste mostrano stato offline/errore onesto (`ListFetchNotice`).
