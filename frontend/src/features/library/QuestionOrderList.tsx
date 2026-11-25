import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import styles from "./Library.module.css";
import type { QuestionOrder } from "./useQuestionOrder";

// HU-3.4: el orden de las preguntas mientras se edita. Cada pregunta sube, baja o va a un puesto
// concreto con botones y un selector, así funciona con teclado y en el celular.
export function QuestionOrderList({ order }: { order: QuestionOrder }) {
  return (
    <div className={styles.orderPanel}>
      <p className={styles.muted}>
        Cambia el orden y confirma con «Guardar orden». La primera pregunta de la lista será la primera de la partida.
      </p>
      {order.error && <FormMessage>{order.error}</FormMessage>}

      <ol className={styles.orderList} aria-label="Orden de las preguntas">
        {order.items.map((item, index) => (
          <li key={item.id} className={styles.orderItem}>
            <span className={styles.questionNumber}>{item.number}.</span>
            <span className={styles.orderText}>{item.text}</span>
            <div className={styles.orderActions}>
              <Button
                variant="secondary"
                onClick={() => order.moveUp(index)}
                disabled={item.isFirst || order.saving}
                aria-label={`Subir la pregunta ${item.number}`}
              >
                ↑
              </Button>
              <Button
                variant="secondary"
                onClick={() => order.moveDown(index)}
                disabled={item.isLast || order.saving}
                aria-label={`Bajar la pregunta ${item.number}`}
              >
                ↓
              </Button>
              <select
                className={styles.orderSelect}
                value={item.number}
                onChange={(event) => order.moveTo(index, Number(event.target.value))}
                disabled={order.saving}
                aria-label={`Mover la pregunta ${item.number} al puesto`}
              >
                {Array.from({ length: order.total }, (_, position) => (
                  <option key={position} value={position + 1}>
                    Puesto {position + 1}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.cardActions}>
        <Button onClick={order.save} disabled={order.saving}>
          {order.saving ? "Guardando…" : "Guardar orden"}
        </Button>
        <Button variant="secondary" onClick={order.cancel} disabled={order.saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
