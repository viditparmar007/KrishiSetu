import Alert from "./components/common/Alert";
import Badge from "./components/common/Badge";
import Card from "./components/common/Card";

function App() {
  return (
    <div className="min-h-screen bg-[#F6F8F2] p-8 text-[#17251B]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-[#1F6B45]">
          STEP 0.8
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          KrishiSetu Alert System
        </h1>

        <p className="mt-2 text-[#667168]">
          Clear feedback messages for farmers.
        </p>

        <Card className="mt-8">
          <h2 className="text-lg font-bold">
            System Messages
          </h2>

          <div className="mt-6 space-y-4">
            <Alert variant="success">
              Your booking has been confirmed successfully.
            </Alert>

            <Alert variant="warning">
              Queue conditions may change based on live centre activity.
            </Alert>

            <Alert variant="error">
              Unable to confirm your booking. Please try again.
            </Alert>

            <Alert variant="info">
              Your payment is currently being processed.
            </Alert>
          </div>
        </Card>

        <Card className="mt-5">
          <div className="flex items-center gap-3">
            <Badge variant="success">
              Ready
            </Badge>

            <span className="text-sm text-[#667168]">
              System is working normally.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;