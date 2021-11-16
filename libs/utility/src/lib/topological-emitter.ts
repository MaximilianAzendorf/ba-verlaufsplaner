import {Pair} from "@vp/api-interfaces";
import toposort from "toposort";
import {sortBy} from "lodash";

/**
 * This class represents a single subscription and holds the necessary references to cancel the subscription.
 */
class TopologicalSubscriptionConstructable<Entry>
{
    /**
     * Constructs a new subscription.
     */
    public constructor(
        private readonly _listener: Entry,
        private readonly _listenerArray: Entry[],
        private readonly _unsubCallback: () => void)
    {
    }

    /**
     * Cancels the subscription by removing the listener entry from the listener array and calling the unsubscribe
     * callback.
     */
    public unsubscribe()
    {
        let index = this._listenerArray.indexOf(this._listener);
        if (index < 0) throw Error("Invalid emitter state");

        this._listenerArray.splice(index, 1);
        this._unsubCallback();
    }
}

/**
 * The data of a single listener.
 */
interface TopologicalListener<Identity>
{
    /**
     * The identity of the listener.
     */
    identity: Identity,

    /**
     * The callback function of the listener.
     */
    callback: TopologicalCallback<Identity>;

    /**
     * The dependencies of the listener. There are two special values "first" and "last", signifying that this listener
     * should be run before or after all "normal" listeners.
     */
    dependencies: "first" | "last" | Identity[];
}

/**
 * The type of callback functions accepted by the emitter. They can return void or a void promise (in case of
 * asynchronous functions). All subscriptions are run in strict order, meaning that asynchronous callbacks are awaited
 * before the next one is called.
 */
export type TopologicalCallback<Identity> = (origin: Identity) => (void | Promise<void>)

/**
 * This type represents a single subscription. Using an object of this type, one can cancel the subscription by calling
 * its unsubscribe method.
 */
export type TopologicalSubscription = Pick<
    TopologicalSubscriptionConstructable<TopologicalListener<any>>,
    "unsubscribe">;

/**
 * This class represents an event emitter that can be subscribed to, which calls its subscriptions in an order
 * determined by given dependencies between them. It accomplishes this by topologically sorting its subscriptions based
 * on the given dependencies.
 */
export class TopologicalEmitter<Identity>
{
    /**
     * Contains all subscribed listeners of this emitter.
     */
    private _listeners: TopologicalListener<Identity>[] = [];

    /**
     * This is set to true if the listeners need to be sorted before calling them. This is set to true whenever a
     * listener is added or removed.
     */
    private _needSorting = false;

    /**
     * Subscribes to this emitter.
     *
     * @param identity The identity of this subscriber. This identity can be given as as dependency by other
     * subscribers.
     * @param dependencies A (possibly empty) list of dependencies that this subscription relies on. All subscriptions
     * given as a dependency are guaranteed to be run before this subscription.
     * @param callback The callback function that should be run whenever the emitter is emitted. It takes a single
     * argument that contains an origin identity, signifying from where the emitter got emitted.
     */
    public subscribe(
        identity: Identity,
        dependencies: Identity[] | "first" | "last",
        callback: TopologicalCallback<Identity>)
        : TopologicalSubscription
    {
        let listener = {
            identity: identity,
            callback: callback,
            dependencies: Array.isArray(dependencies) ? Array.from(dependencies) : dependencies
        };

        this._listeners.push(listener);
        this._needSorting = true;

        return new TopologicalSubscriptionConstructable(
            listener,
            this._listeners,
            () => this._needSorting = true);
    }

    /**
     * Emits the emitter. The given origin is handed to the subscribers.
     */
    public async emit(origin: Identity)
    {
        if (this._needSorting) this._sortListenersTopologically();

        for (let listener of this._listeners)
        {
            await listener.callback(origin);
        }
    }

    /**
     * Sorts the listeners topologically, according to their dependencies.
     */
    private _sortListenersTopologically()
    {
        let graph: Pair<Identity>[] = [];

        for (let listener of this._listeners)
        {
            if (!Array.isArray(listener.dependencies))
            {
                for (let otherListener of this._listeners)
                {
                    if (listener == otherListener) continue;
                    let dep = [listener.identity, otherListener.identity];
                    if (listener.dependencies == "last") dep = dep.reverse();
                    graph.push(dep as Pair<Identity>);
                }
            }
            else
            {
                for (let depIdentity of listener.dependencies)
                {
                    graph.push([depIdentity, listener.identity]);
                }
            }
        }

        let topologicalSort = toposort(graph);

        this._listeners = sortBy(this._listeners, listener => topologicalSort.indexOf(listener.identity));
        this._needSorting = false;
    }
}
