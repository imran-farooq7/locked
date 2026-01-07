const Faqs = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about LOCKED
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              q: "How much does LOCKED cost?",
              a: "LOCKED is free to use. We only charge if you fail to complete your goal. You set the penalty amount, and if you fail, that penalty is charged. No subscription fees.",
            },
            {
              q: "What happens if I actually complete my goal?",
              a: "Congratulations! You submit proof before your deadline, we verify it (if required), and no penalty is charged. You keep your money and achieve your goal.",
            },
            {
              q: "What kind of proof do I need to provide?",
              a: "It depends on your goal. For fitness goals, it could be a photo. For writing goals, a document. For learning goals, a quiz result. You choose what proof makes sense.",
            },
            {
              q: "Can I get a refund if something unexpected happens?",
              a: "We have an appeal process for genuine emergencies. Life happens, and we understand. Submit an appeal with documentation, and our team will review it.",
            },
            {
              q: "Is my payment information secure?",
              a: "Absolutely. We use Stripe for all payments, which is PCI-DSS compliant. We never store your credit card information on our servers.",
            },
          ].map((faq, index) => (
            <div key={index} className="border-b pb-6">
              <h3 className="text-xl font-bold mb-3">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faqs;
